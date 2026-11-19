# -*- coding: utf-8 -*-
"""
Pruebas unitarias para `functions/_lib/license_signer.js` (Ed25519 v2).
Genera sobres `.lic` reales usando Node.js WebCrypto + `ed25519_private_key.pem`
y los verifica tanto con `cryptography` (clave pública embebida) como con
`QuoraTec_ERP/core/license_manager.py` en modo solo lectura (`dont_write_bytecode`).
"""

import base64
import datetime
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

# Regla estricta de solo lectura sobre QuoraTec_ERP: no escribir .pyc/__pycache__ allí.
sys.dont_write_bytecode = True

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

PORTAL_DIR = Path(__file__).resolve().parents[1]
WORKSPACE_DIR = PORTAL_DIR.parent
QUORATEC_ERP_DIR = WORKSPACE_DIR / "QuoraTec_ERP"
PRIVATE_KEY_PATH = QUORATEC_ERP_DIR / "ed25519_private_key.pem"
SIGNER_JS_PATH = PORTAL_DIR / "functions" / "_lib" / "license_signer.js"

EMBEDDED_ED25519_PUB_PEM = b"""-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAav+otWmbUr/KIAm/AwzWVbFMtI/Z7gWR2SVFRn/JDXc=
-----END PUBLIC KEY-----"""


def _b64url_decode(data: str) -> bytes:
    pad = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + pad).encode("ascii"))


def _run_node_signer(license_obj: dict, pem_raw: str) -> dict:
    signer_url = SIGNER_JS_PATH.as_uri()
    script = f"""
import {{ signLicenseV2 }} from {json.dumps(signer_url)};
const license = JSON.parse(process.env.TEST_LICENSE_JSON);
const env = {{ ED25519_PRIVATE_KEY_PEM: process.env.TEST_ED25519_PEM }};
const envelope = await signLicenseV2(license, env);
process.stdout.write(JSON.stringify(envelope));
"""
    env = os.environ.copy()
    env["TEST_LICENSE_JSON"] = json.dumps(license_obj)
    env["TEST_ED25519_PEM"] = pem_raw
    proc = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=str(PORTAL_DIR),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Node signer error ({proc.returncode}): {proc.stderr.strip()}")
    return json.loads(proc.stdout)


class TestLicenseSignerEd25519(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not PRIVATE_KEY_PATH.is_file():
            raise unittest.SkipTest(f"No se encontró clave privada en {PRIVATE_KEY_PATH}")
        cls.private_pem = PRIVATE_KEY_PATH.read_text(encoding="utf-8")
        cls.pub_key = serialization.load_pem_public_key(EMBEDDED_ED25519_PUB_PEM)
        assert isinstance(cls.pub_key, Ed25519PublicKey)

        # Preparar entorno aislado para importar core.license_manager sin tocar disco fuera de temp
        cls._tmp_dir = tempfile.TemporaryDirectory(prefix="qt_signer_test_")
        os.environ["QUORATEC_ENV"] = "test"
        os.environ["QUORATEC_ANCHOR_TEST_DIR"] = cls._tmp_dir.name
        if str(QUORATEC_ERP_DIR) not in sys.path:
            sys.path.insert(0, str(QUORATEC_ERP_DIR))

        from core.license_manager import verificar_licencia_ed25519

        cls.verificar_licencia_ed25519 = staticmethod(verificar_licencia_ed25519)

    @classmethod
    def tearDownClass(cls) -> None:
        cls._tmp_dir.cleanup()

    def _assert_envelope_valid(self, envelope: dict, expected_license_key: str) -> dict:
        self.assertEqual(envelope["version"], 2)
        self.assertEqual(envelope["alg"], "ED25519")
        self.assertEqual(envelope["license_id"], expected_license_key)

        payload_b64 = envelope["payload"]
        signature_b64 = envelope["signature"]
        self.assertNotIn("=", payload_b64)

        sig_bytes = _b64url_decode(signature_b64)
        # Verificar firma directamente contra los bytes ASCII de payload_b64
        self.pub_key.verify(sig_bytes, payload_b64.encode("ascii"))

        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        hoy = datetime.date.today()
        exp_esperada = (hoy + datetime.timedelta(days=365)).isoformat()
        self.assertEqual(payload["fecha_emision"], hoy.isoformat())
        self.assertEqual(payload["expires_at"], exp_esperada)
        self.assertEqual(payload["fecha_caducidad"], exp_esperada)
        return payload

    def test_personal_pro_1pc_con_pem_escapado(self) -> None:
        hwid = "PC-QUITO-001-AABBCC"
        pem_escapado = self.private_pem.replace("\n", "\\n")
        envelope = _run_node_signer(
            {
                "license_key": "TF-LIC-PERS-0001",
                "plan": "PERSONAL_PRO",
                "razon_social": "Juan Pérez",
                "ruc_cedula": "1712345678001",
                "hwid_inicial": hwid.lower(),
                "max_seats": 1,
                "extra_seats": 0,
            },
            pem_escapado,
        )
        payload = self._assert_envelope_valid(envelope, "TF-LIC-PERS-0001")
        self.assertEqual(payload["plan"], "PERSONAL_PRO")
        self.assertEqual(payload["hwid"], hwid)
        self.assertEqual(payload["max_seats"], 1)
        self.assertEqual(payload["cliente"], "Juan Pérez")
        self.assertEqual(payload["ruc_titular"], "1712345678001")

        # Verificar con motor oficial QuoraTec_ERP en el HWID autorizado
        ok, info = self.verificar_licencia_ed25519(json.dumps(envelope), hwid_actual=hwid)
        self.assertTrue(ok, f"Falló verificación en license_manager: {info}")
        self.assertEqual(info["tier"], "PERSONAL_PRO")
        self.assertEqual(info["max_seats"], 1)

        # Verificar rechazo en un HWID distinto
        ok_otro, err_otro = self.verificar_licencia_ed25519(json.dumps(envelope), hwid_actual="PC-OTRO-999")
        self.assertFalse(ok_otro)
        self.assertIn("HWID_MISMATCH", str(err_otro))

    def test_personal_pro_sin_hwid_falla(self) -> None:
        with self.assertRaises(RuntimeError) as ctx:
            _run_node_signer(
                {
                    "license_key": "TF-LIC-PERS-FAIL",
                    "plan": "PERSONAL_PRO",
                    "razon_social": "Sin HWID",
                    "ruc_cedula": "1712345678001",
                    "hwid_inicial": "",
                },
                self.private_pem,
            )
        self.assertIn("hwid_inicial", str(ctx.exception))

    def test_estudio_pro_multi_pc_con_y_sin_hwid_inicial(self) -> None:
        hwid_1 = "PC-OFICINA-111"
        hwid_2 = "PC-CASA-222"
        envelope = _run_node_signer(
            {
                "license_key": "TF-LIC-EST-2026",
                "plan": "ESTUDIO_PRO",
                "razon_social": "Estudio Contable Quoratec S.A.",
                "ruc_cedula": "1799999999001",
                "hwid_inicial": hwid_1,
                "max_seats": 2,
                "extra_seats": 0,
            },
            self.private_pem,
        )
        payload = self._assert_envelope_valid(envelope, "TF-LIC-EST-2026")
        self.assertEqual(payload["plan"], "ESTUDIO_PRO")
        self.assertEqual(payload["tenant_id"], "TF-LIC-EST-2026")
        self.assertGreaterEqual(len(payload["org_token"]), 8)
        self.assertEqual(payload["hwids_autorizados"], [hwid_1])
        self.assertEqual(payload["max_seats"], 2)

        # Verificar activación en PC 1 y PC 2 (Multi-PC por org_token)
        ok_1, info_1 = self.verificar_licencia_ed25519(json.dumps(envelope), hwid_actual=hwid_1)
        self.assertTrue(ok_1, f"Falló PC 1: {info_1}")
        self.assertEqual(info_1["tier"], "ESTUDIO_PRO")
        self.assertEqual(info_1["max_seats"], 2)

        ok_2, info_2 = self.verificar_licencia_ed25519(json.dumps(envelope), hwid_actual=hwid_2)
        self.assertTrue(ok_2, f"Falló PC 2: {info_2}")
        self.assertEqual(info_2["tenant_id"], "TF-LIC-EST-2026")

        # También probar ESTUDIO_PRO sin hwid_inicial debe fallar
        with self.assertRaises(RuntimeError) as ctx_est:
            _run_node_signer(
                {
                    "license_key": "TF-LIC-EST-NOHWID",
                    "plan": "ESTUDIO_PRO",
                    "razon_social": "Estudio Sin HWID Inicial",
                    "ruc_cedula": "1790000000001",
                    "max_seats": 2,
                },
                self.private_pem,
            )
        self.assertIn("hwid_inicial", str(ctx_est.exception))

        # También probar ENTERPRISE_TEAM sin hwid_inicial (solo org_token + tenant_id)
        envelope_ent = _run_node_signer(
            {
                "license_key": "TF-LIC-TEAM-NOHWID",
                "plan": "ENTERPRISE_TEAM",
                "razon_social": "Empresa Sin HWID Inicial",
                "ruc_cedula": "1790000000001",
                "max_seats": 5,
            },
            self.private_pem,
        )
        payload_ent = self._assert_envelope_valid(envelope_ent, "TF-LIC-TEAM-NOHWID")
        self.assertNotIn("hwids_autorizados", payload_ent)
        self.assertEqual(payload_ent["tenant_id"], "TF-LIC-TEAM-NOHWID")
        self.assertGreaterEqual(len(payload_ent["org_token"]), 8)
        ok_ent, info_ent = self.verificar_licencia_ed25519(
            json.dumps(envelope_ent),
            hwid_actual="PC-REMOTA-333",
        )
        self.assertTrue(ok_ent, f"Falló ENTERPRISE_TEAM sin hwid_inicial: {info_ent}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
