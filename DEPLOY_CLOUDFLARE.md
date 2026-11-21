# Guía Oficial de Despliegue — QuoraTec ERP Portal (`erp.quoratec.com` / `quoratec.com`)

Despliegue completo en **Cloudflare Pages + Cloudflare D1 + Supabase Auth/Storage + Resend + PayPhone Business**.

---

## 1. Crear y Enlazar Base de Datos Cloudflare D1

1. Crear la base D1 en Cloudflare:
```bash
npx wrangler d1 create quoratec-erp-db
```

2. Anotar el `database_id` devuelto y configurarlo en `wrangler.toml` (o en **Cloudflare Pages → Settings → Functions → D1 database bindings** con el nombre de variable `DB`).

3. Aplicar el esquema idempotente en entorno remoto:
```bash
npx wrangler d1 execute quoratec-erp-db --remote --file=./d1/schema.sql
```

4. Verificar tablas creadas en remoto:
```bash
npx wrangler d1 execute quoratec-erp-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 2. Configurar Variables Secretas y de Entorno en Cloudflare Pages

Ejecutar o cargar en **Cloudflare Pages → Settings → Environment variables** (Production y Preview):

```bash
# Base de datos / Autenticación / Almacenamiento
npx wrangler pages secret put SUPABASE_URL --project-name=quoratec-erp-portal
npx wrangler pages secret put SUPABASE_ANON_KEY --project-name=quoratec-erp-portal
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=quoratec-erp-portal
npx wrangler pages secret put JWT_SECRET --project-name=quoratec-erp-portal

# Firma Criptográfica Ed25519 v2 y HMAC
npx wrangler pages secret put ED25519_PRIVATE_KEY --project-name=quoratec-erp-portal
npx wrangler pages secret put MASTER_ED25519_PRIVATE_KEY --project-name=quoratec-erp-portal
npx wrangler pages secret put DEMO_ED25519_PRIVATE_KEY --project-name=quoratec-erp-portal
npx wrangler pages secret put LICENSE_HMAC_SECRET --project-name=quoratec-erp-portal
npx wrangler pages secret put ORDER_TOKEN_SECRET --project-name=quoratec-erp-portal

# PayPhone Business
npx wrangler pages secret put PAYPHONE_TOKEN --project-name=quoratec-erp-portal
npx wrangler pages secret put PAYPHONE_STORE_ID --project-name=quoratec-erp-portal
npx wrangler pages secret put PAYPHONE_WEBHOOK_SECRET --project-name=quoratec-erp-portal

# Correos Corporativos (Resend)
npx wrangler pages secret put RESEND_API_KEY --project-name=quoratec-erp-portal
```

Variables públicas / feature flags recomendadas en Cloudflare Pages:
- `FF_PAYPHONE_BUSINESS_ENABLED=true` (o `false` mientras se activa la cuenta comercio)
- `RESEND_FROM_EMAIL=soporte@quoratec.com`
- `COMMISSION_NEW_SALE_RATE=20`
- `COMMISSION_RENEWAL_RATE=10`
- `COMMISSION_HOLD_DAYS=7`

---

## 3. Despliegue de Cloudflare Pages

```bash
python scripts/build_portal.py --check
npx wrangler pages deploy . --project-name=quoratec-erp-portal
```

---

## 4. Enlazar Dominios Personalizados (`quoratec.com` y `erp.quoratec.com`)

1. En **Cloudflare Dashboard → Workers & Pages → `quoratec-erp-portal` → Custom domains**:
   - Agregar `erp.quoratec.com` (registro CNAME apuntando al subdominio `.pages.dev` del proyecto).
   - Agregar `quoratec.com` (y regla de redirección o alias según arquitectura comercial).
2. Confirmar SSL/TLS en modo **Full (strict)** y **Always Use HTTPS** activado.
3. Verificar endpoints en producción:
   - `GET https://erp.quoratec.com/api/v1/health`
   - `GET https://erp.quoratec.com/api/v1/releases/latest`
   - `GET https://erp.quoratec.com/api/reglas_sri.json`
