-- ============================================================================
-- QuoraTec ERP (erp.quoratec.com / quoratec.com) — Esquema Idempotente D1 (SQLite)
-- Fase 1: Usuarios/Roles, Órdenes, Licencias, Comisiones, Multi-RUC y Releases
-- ============================================================================

-- 1. USUARIOS Y ROLES (admin, asesora, contador, cliente + codigo_referido único)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    ruc_cedula TEXT,
    role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'asesora', 'contador', 'cliente')),
    codigo_referido TEXT UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_codigo_referido ON users(codigo_referido);

-- 2. ÓRDENES DE COMPRA (conservando columnas actuales + seguimiento de asesoras)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_ref TEXT NOT NULL UNIQUE,
    order_token_hash TEXT NOT NULL,
    checkout_mode TEXT NOT NULL DEFAULT 'guest' CHECK (checkout_mode IN ('guest', 'account')),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    ruc_cedula TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    plan_id TEXT NOT NULL CHECK (plan_id IN ('EMPRENDEDOR', 'COMERCIAL_PRO', 'CONTADOR', 'ESTUDIO_CONTABLE', 'ENTERPRISE')),
    extra_seats INTEGER NOT NULL DEFAULT 0,
    extra_rucs_packs INTEGER NOT NULL DEFAULT 0,
    extra_cloud_packs INTEGER NOT NULL DEFAULT 0,
    cloud_opcional_emprendedor INTEGER NOT NULL DEFAULT 0,
    estaciones_autorizadas INTEGER NOT NULL DEFAULT 1,
    monto_autorizado_usd REAL NOT NULL,
    payment_channel TEXT NOT NULL CHECK (payment_channel IN ('DEUNA_PERSONAL', 'TRANSFERENCIA', 'DEUNA_NEGOCIOS', 'PAYPHONE_BUSINESS')),
    status TEXT NOT NULL DEFAULT 'pendiente_verificacion' CHECK (status IN ('pendiente_verificacion', 'verificado', 'rechazado', 'expirado')),
    voucher_ref TEXT,
    banco_origen TEXT,
    comprobante_nombre TEXT,
    comprobante_mime TEXT,
    comprobante_sha256 TEXT,
    comprobante_path TEXT,
    hwid_inicial TEXT,
    sale_type TEXT NOT NULL DEFAULT 'new_sale' CHECK (sale_type IN ('new_sale', 'upgrade', 'renewal')),
    referral_code TEXT,
    asesor_code TEXT,
    commission_rate REAL NOT NULL DEFAULT 0.20,
    commission_amount_usd REAL NOT NULL DEFAULT 0.00,
    commission_status TEXT NOT NULL DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid')),
    payphone_transaction_id TEXT,
    claimed_at TEXT,
    verified_at TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_asesor ON orders(asesor_code, commission_status);

-- 3. LICENCIAS OFICIALES (Ed25519 v2 + HWID + org_token)
CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    license_id TEXT NOT NULL UNIQUE,
    license_key TEXT UNIQUE,
    org_token TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    holder_ruc TEXT NOT NULL,
    plan_name TEXT NOT NULL CHECK (plan_name IN ('EMPRENDEDOR', 'COMERCIAL_PRO', 'CONTADOR', 'ESTUDIO_CONTABLE', 'ENTERPRISE', 'DEMO_15_DIAS')),
    plan_id TEXT,
    ruc_cedula TEXT,
    max_rucs INTEGER NOT NULL DEFAULT 1,
    max_seats INTEGER NOT NULL DEFAULT 1,
    estaciones_autorizadas INTEGER NOT NULL DEFAULT 1,
    cloud_gb INTEGER NOT NULL DEFAULT 0,
    is_founder INTEGER NOT NULL DEFAULT 0,
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'demo', 'qa_test')),
    hwid_inicial TEXT,
    lic_storage_path TEXT,
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'read_only', 'revoked', 'expired')),
    active_status TEXT NOT NULL DEFAULT 'activa' CHECK (active_status IN ('activa', 'solo_lectura', 'revocada'))
);

CREATE INDEX IF NOT EXISTS idx_licenses_org_token ON licenses(org_token);
CREATE INDEX IF NOT EXISTS idx_licenses_holder_ruc ON licenses(holder_ruc);

-- 4. POLÍTICAS Y REGISTRO DE COMISIONES (0.20 ventas/upgrades, 0.10 renovaciones)
CREATE TABLE IF NOT EXISTS commission_policies (
    id TEXT PRIMARY KEY DEFAULT 'default',
    new_sale_rate REAL NOT NULL DEFAULT 20.00,
    renewal_rate REAL NOT NULL DEFAULT 10.00,
    hold_days INTEGER NOT NULL DEFAULT 7,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_commissions (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
    license_id TEXT REFERENCES licenses(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL,
    asesor_code TEXT,
    advisor_name TEXT,
    sale_type TEXT NOT NULL DEFAULT 'new_sale' CHECK (sale_type IN ('new_sale', 'upgrade', 'renewal')),
    payment_type TEXT NOT NULL DEFAULT 'first_payment' CHECK (payment_type IN ('first_payment', 'renewal')),
    commission_rate REAL NOT NULL DEFAULT 0.20,
    base_amount_usd REAL NOT NULL DEFAULT 0,
    net_collected_usd REAL NOT NULL DEFAULT 0,
    commission_usd REAL NOT NULL DEFAULT 0,
    commission_amount_usd REAL NOT NULL DEFAULT 0,
    commission_status TEXT NOT NULL DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid')),
    hold_days INTEGER NOT NULL DEFAULT 7,
    approved_at TEXT,
    eligible_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending_settlement' CHECK (status IN ('pending_payment', 'pending_settlement', 'payable', 'paid', 'reversed')),
    reversal_reason TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ref_commissions_asesor ON referral_commissions(asesor_code, commission_status);

-- 5. GESTIÓN MULTI-RUC Y ESTUDIO CONTABLE (tenants_ruc + contador_access)
CREATE TABLE IF NOT EXISTS tenants_ruc (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    org_token TEXT NOT NULL,
    ruc_cedula TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    plan_id TEXT NOT NULL DEFAULT 'CONTADOR',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (org_token, ruc_cedula)
);

CREATE INDEX IF NOT EXISTS idx_tenants_ruc_lookup ON tenants_ruc(ruc_cedula, is_active);

CREATE TABLE IF NOT EXISTS contador_access (
    id TEXT PRIMARY KEY,
    contador_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    tenant_ruc TEXT NOT NULL,
    link_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    expires_at TEXT,
    bound_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contador_access_code ON contador_access(link_code, status);
CREATE INDEX IF NOT EXISTS idx_contador_access_user ON contador_access(contador_user_id, status);

-- 6. RELEASES DEL ERP (erp_releases)
CREATE TABLE IF NOT EXISTS erp_releases (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    tag_name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'windows_x64',
    file_name TEXT NOT NULL,
    download_url TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    is_latest INTEGER NOT NULL DEFAULT 1,
    published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_erp_releases_latest ON erp_releases(is_latest, platform, published_at DESC);

-- 7. CÓDIGOS OTP DE SEGURIDAD / RECUPERACIÓN (expiración 10 min)
CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'password_recovery' CHECK (purpose IN ('password_recovery', 'security_verification')),
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email, expires_at);
