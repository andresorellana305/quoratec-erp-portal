-- Esquema Compartido Supabase PostgreSQL + RLS Estricto + TOTP MFA (aal2)
-- Conecta Portal Web (erp.quoratec.com) + QuoraTec ERP Desktop + Centralis Engine
-- QuoraTec ERP v3.0.0 — Edición 2026 (QuoraTec)

create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- 1. ROLES DEL EQUIPO INTERNO (Supabase Auth + 2FA TOTP aal2 obligatorio)
-- ============================================================================
create table if not exists public.staff_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    city text not null,
    role text not null check (role in ('founder', 'support_agent')),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_staff_roles_active_role on public.staff_roles(role, is_active);

-- Funciones auxiliares RLS con search_path fijo (verifican sesion 2FA TOTP aal2 + staff activo)
create or replace function public.is_aal2_session()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select sr.role
    from public.staff_roles sr
    where sr.user_id = auth.uid()
      and sr.is_active = true
      and public.is_aal2_session()
    limit 1;
$$;

revoke all on function public.is_aal2_session() from public;
grant execute on function public.is_aal2_session() to authenticated, service_role;
revoke all on function public.current_staff_role() from public;
grant execute on function public.current_staff_role() to authenticated, service_role;

-- ============================================================================
-- 2. ÓRDENES DE COMPRA HÍBRIDA (Invitado + Cuenta Supabase)
-- ============================================================================
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_ref text unique not null,
    order_token_hash text not null,
    checkout_mode text not null check (checkout_mode in ('guest', 'account')),
    user_id uuid references auth.users(id) on delete set null,
    email text not null,
    ruc_cedula text not null,
    razon_social text not null,
    plan_id text not null check (plan_id in ('EMPRENDEDOR', 'COMERCIAL_PRO', 'CONTADOR', 'ESTUDIO_CONTABLE', 'ENTERPRISE')),
    extra_seats integer not null default 0 check (extra_seats >= 0 and extra_seats <= 50),
    extra_rucs_packs integer not null default 0 check (extra_rucs_packs >= 0 and extra_rucs_packs <= 50),
    extra_cloud_packs integer not null default 0 check (extra_cloud_packs >= 0 and extra_cloud_packs <= 50),
    cloud_opcional_emprendedor boolean not null default false,
    estaciones_autorizadas integer not null check (estaciones_autorizadas >= 1),
    monto_autorizado_usd numeric(10, 2) not null check (monto_autorizado_usd > 0),
    payment_channel text not null check (payment_channel in ('DEUNA_PERSONAL', 'TRANSFERENCIA', 'DEUNA_NEGOCIOS', 'PAYPHONE_BUSINESS')),
    status text not null default 'pendiente_verificacion' check (status in ('pendiente_verificacion', 'verificado', 'rechazado', 'expirado')),
    voucher_ref text,
    banco_origen text,
    comprobante_nombre text,
    comprobante_mime text,
    comprobante_sha256 text,
    comprobante_path text,
    hwid_inicial text,
    claimed_at timestamptz,
    verified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_email on public.orders(lower(email));
create index if not exists idx_orders_status on public.orders(status);

-- ============================================================================
-- 3. LICENCIAS OFICIALES & DEMOS (Compartida: Portal + ERP + Centralis Engine)
-- ============================================================================
create table if not exists public.licenses (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders(id) on delete set null,
    user_id uuid references auth.users(id) on delete set null,
    issued_by uuid references auth.users(id) on delete set null,
    license_id text unique not null,
    license_key text unique,
    org_token text not null,
    holder_name text not null,
    holder_ruc text not null,
    plan_name text not null check (plan_name in ('EMPRENDEDOR', 'COMERCIAL_PRO', 'CONTADOR', 'ESTUDIO_CONTABLE', 'ENTERPRISE', 'DEMO_15_DIAS')),
    plan_id text,
    ruc_cedula text,
    max_rucs integer not null default 1 check (max_rucs >= 1),
    max_seats integer not null default 1 check (max_seats >= 1),
    estaciones_autorizadas integer not null default 1 check (estaciones_autorizadas >= 1),
    cloud_gb integer not null default 0 check (cloud_gb >= 0),
    storage_modes text[] not null default array['local'],
    is_founder boolean not null default false,
    environment text not null default 'production' check (environment in ('production', 'demo', 'qa_test')),
    hwid_inicial text,
    lic_storage_path text,
    issued_at timestamptz not null default now(),
    expires_at timestamptz not null,
    status text not null default 'active' check (status in ('active', 'read_only', 'revoked', 'expired')),
    active_status text not null default 'activa' check (active_status in ('activa', 'solo_lectura', 'revocada'))
);

-- Migración idempotente si la tabla `licenses` ya existía en producción de Fase 1
alter table public.licenses add column if not exists issued_by uuid references auth.users(id) on delete set null;
alter table public.licenses add column if not exists license_id text;
alter table public.licenses add column if not exists org_token text;
alter table public.licenses add column if not exists holder_name text;
alter table public.licenses add column if not exists holder_ruc text;
alter table public.licenses add column if not exists plan_name text;
alter table public.licenses add column if not exists max_rucs integer not null default 1;
alter table public.licenses add column if not exists max_seats integer not null default 1;
alter table public.licenses add column if not exists cloud_gb integer not null default 0;
alter table public.licenses add column if not exists storage_modes text[] not null default array['local'];
alter table public.licenses add column if not exists is_founder boolean not null default false;
alter table public.licenses add column if not exists environment text not null default 'production';
alter table public.licenses add column if not exists hwid_inicial text;
alter table public.licenses add column if not exists lic_storage_path text;
alter table public.licenses add column if not exists status text not null default 'active';

create index if not exists idx_licenses_org_token on public.licenses(org_token);
create index if not exists idx_licenses_holder_ruc on public.licenses(holder_ruc);
create index if not exists idx_licenses_environment_issued on public.licenses(environment, issued_by, issued_at desc);

create table if not exists public.license_devices (
    id uuid primary key default gen_random_uuid(),
    license_id uuid not null references public.licenses(id) on delete cascade,
    hwid text not null,
    etiqueta text,
    es_adicional boolean not null default false,
    linked_at timestamptz not null default now(),
    unique (license_id, hwid)
);

-- ============================================================================
-- 4. ESTACIONES REGISTRADAS POR ORGANIZACIÓN (Control Multi-PC)
-- ============================================================================
create table if not exists public.registered_seats (
    id uuid primary key default gen_random_uuid(),
    org_token text not null,
    hardware_fingerprint text not null,
    pc_name text not null,
    last_seen_at timestamptz not null default now(),
    is_active boolean not null default true,
    unique (org_token, hardware_fingerprint)
);

create index if not exists idx_registered_seats_org on public.registered_seats(org_token, is_active);

-- ============================================================================
-- 5. BÓVEDAS CONTABLES DE EMPRESAS (Bloqueo Multi-Usuario / Nube Híbrida)
-- ============================================================================
create table if not exists public.company_vaults (
    id uuid primary key default gen_random_uuid(),
    org_token text not null,
    empresa_ruc text not null,
    pin_hash text not null,
    lock_status text not null default 'available' check (lock_status in ('available', 'in_review_by_accountant')),
    locked_by text,
    storage_mode text not null default 'local' check (storage_mode in ('local', 'hybrid', 'cloud', 'cloud_dedicated')),
    used_gb numeric(10, 3) not null default 0 check (used_gb >= 0),
    updated_at timestamptz not null default now(),
    unique (org_token, empresa_ruc)
);

create index if not exists idx_company_vaults_org_ruc on public.company_vaults(org_token, empresa_ruc);

-- ============================================================================
-- 6. TICKETS DE SOPORTE Y DIAGNÓSTICOS CIFRADOS (.zip en bucket 'diagnostics')
-- ============================================================================
create table if not exists public.support_tickets (
    id uuid primary key default gen_random_uuid(),
    empresa_ruc text not null,
    client_name text not null,
    app_version text not null,
    description text not null,
    diagnostic_zip_path text,
    status text not null default 'open' check (status in ('open', 'in_progress', 'escalated', 'resolved', 'closed')),
    assigned_to uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_status_created on public.support_tickets(status, created_at desc);
create index if not exists idx_support_tickets_ruc on public.support_tickets(empresa_ruc);

-- ============================================================================
-- 7. COLA DE PEDIDOS CENTRALIS ENGINE (WhatsApp / Telegram -> Proforma ERP)
-- ============================================================================
create table if not exists public.centralis_orders_queue (
    id uuid primary key default gen_random_uuid(),
    org_token text not null,
    empresa_ruc text not null,
    source_channel text not null check (source_channel in ('whatsapp', 'telegram', 'portal', 'api')),
    external_order_id text not null,
    payload_json jsonb not null default '{}'::jsonb,
    status text not null default 'pending' check (status in ('pending', 'processing', 'proforma_created', 'failed', 'cancelled')),
    erp_proforma_number text,
    created_at timestamptz not null default now(),
    unique (org_token, source_channel, external_order_id)
);

create index if not exists idx_centralis_queue_org_status on public.centralis_orders_queue(org_token, status, created_at desc);

-- ============================================================================
-- 8. BITÁCORA INMUTABLE DE AUDITORÍA CRÍTICA (audit_logs)
-- ============================================================================
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    actor_role text,
    actor_city text,
    action text not null,
    target_table text not null,
    target_id text,
    environment text,
    ip_address text,
    user_agent text,
    metadata_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id, created_at desc);

create or replace function public.prevent_audit_logs_mutation()
returns trigger
language plpgsql
as $$
begin
    raise exception 'audit_logs is append-only and immutable (UPDATE/DELETE prohibited)';
end;
$$;

drop trigger if exists trg_audit_logs_immutable on public.audit_logs;
create trigger trg_audit_logs_immutable
    before update or delete on public.audit_logs
    for each row
    execute function public.prevent_audit_logs_mutation();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) ESTRICTO EN TODAS LAS TABLAS
-- ============================================================================
alter table public.staff_roles enable row level security;
alter table public.orders enable row level security;
alter table public.licenses enable row level security;
alter table public.license_devices enable row level security;
alter table public.registered_seats enable row level security;
alter table public.company_vaults enable row level security;
alter table public.support_tickets enable row level security;
alter table public.centralis_orders_queue enable row level security;
alter table public.audit_logs enable row level security;

-- Bloquear todo acceso directo anónimo en tablas internas del negocio y equipo
revoke all on public.staff_roles from anon, public;
revoke all on public.registered_seats from anon, public;
revoke all on public.company_vaults from anon, public;
revoke all on public.support_tickets from anon, public;
revoke all on public.centralis_orders_queue from anon, public;
revoke all on public.audit_logs from anon, public;

-- staff_roles: cada miembro autenticado lee únicamente su propio perfil; founder aal2 puede auditar equipo
drop policy if exists "staff_roles_self_or_founder_select" on public.staff_roles;
create policy "staff_roles_self_or_founder_select"
    on public.staff_roles for select
    to authenticated
    using (
        auth.uid() = user_id
        or public.current_staff_role() = 'founder'
    );

-- orders: titular autenticado lee únicamente sus propias órdenes
drop policy if exists "orders_owner_select" on public.orders;
create policy "orders_owner_select"
    on public.orders for select
    to authenticated
    using (auth.uid() = user_id or public.current_staff_role() = 'founder');

-- licenses: titular lee su licencia; founder aal2 consulta todo; support_agent aal2 consulta solo lectura
drop policy if exists "licenses_owner_select" on public.licenses;
drop policy if exists "licenses_owner_or_staff_aal2_select" on public.licenses;
create policy "licenses_owner_or_staff_aal2_select"
    on public.licenses for select
    to authenticated
    using (
        auth.uid() = user_id
        or public.current_staff_role() in ('founder', 'support_agent')
    );

-- license_devices: titular autenticado o founder aal2
drop policy if exists "license_devices_owner_select" on public.license_devices;
create policy "license_devices_owner_select"
    on public.license_devices for select
    to authenticated
    using (
        exists (
            select 1 from public.licenses l
            where l.id = license_devices.license_id
              and (l.user_id = auth.uid() or public.current_staff_role() = 'founder')
        )
    );

-- registered_seats: titular del org_token o staff aal2 (lectura)
drop policy if exists "registered_seats_tenant_or_staff_select" on public.registered_seats;
create policy "registered_seats_tenant_or_staff_select"
    on public.registered_seats for select
    to authenticated
    using (
        public.current_staff_role() in ('founder', 'support_agent')
        or exists (
            select 1 from public.licenses l
            where l.org_token = registered_seats.org_token
              and l.user_id = auth.uid()
        )
    );

-- company_vaults: nunca expuesto a support_agent (protege pin_hash y contabilidad privada); solo titular o founder aal2
drop policy if exists "company_vaults_tenant_or_founder_select" on public.company_vaults;
create policy "company_vaults_tenant_or_founder_select"
    on public.company_vaults for select
    to authenticated
    using (
        public.current_staff_role() = 'founder'
        or exists (
            select 1 from public.licenses l
            where l.org_token = company_vaults.org_token
              and l.user_id = auth.uid()
        )
    );

-- support_tickets: solo equipo activo con 2FA TOTP (aal2) lee y actualiza triaje (sin DELETE)
drop policy if exists "support_tickets_staff_aal2_select" on public.support_tickets;
create policy "support_tickets_staff_aal2_select"
    on public.support_tickets for select
    to authenticated
    using (public.current_staff_role() in ('founder', 'support_agent'));

drop policy if exists "support_tickets_staff_aal2_update" on public.support_tickets;
create policy "support_tickets_staff_aal2_update"
    on public.support_tickets for update
    to authenticated
    using (public.current_staff_role() in ('founder', 'support_agent'))
    with check (public.current_staff_role() in ('founder', 'support_agent'));

-- centralis_orders_queue: titular del org_token o founder aal2
drop policy if exists "centralis_queue_tenant_or_founder_select" on public.centralis_orders_queue;
create policy "centralis_queue_tenant_or_founder_select"
    on public.centralis_orders_queue for select
    to authenticated
    using (
        public.current_staff_role() = 'founder'
        or exists (
            select 1 from public.licenses l
            where l.org_token = centralis_orders_queue.org_token
              and l.user_id = auth.uid()
        )
    );

-- audit_logs: únicamente founder con aal2 puede leer bitácora; inserciones exclusivas vía service_role
drop policy if exists "audit_logs_founder_aal2_select" on public.audit_logs;
create policy "audit_logs_founder_aal2_select"
    on public.audit_logs for select
    to authenticated
    using (public.current_staff_role() = 'founder');

-- ============================================================================
-- 10. BUCKETS PRIVADOS EN SUPABASE STORAGE ('diagnostics' y 'licenses')
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('diagnostics', 'diagnostics', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('licenses', 'licenses', false)
on conflict (id) do update set public = false;

drop policy if exists "diagnostics_staff_aal2_select" on storage.objects;
create policy "diagnostics_staff_aal2_select"
    on storage.objects for select
    to authenticated
    using (
        bucket_id = 'diagnostics'
        and public.current_staff_role() in ('founder', 'support_agent')
    );

-- ============================================================================
-- 11. RPC SEGURA PARA MODO INVITADO (order_token + email, solo service_role)
-- ============================================================================
create or replace function public.get_guest_order_status(
    p_order_ref text,
    p_order_token text,
    p_email text
)
returns table (
    order_ref text,
    checkout_mode text,
    plan_id text,
    estaciones_autorizadas integer,
    monto_autorizado_usd numeric,
    payment_channel text,
    status text,
    voucher_ref text,
    razon_social text,
    ruc_cedula text,
    can_claim_account boolean,
    created_at timestamptz,
    updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
    select
        o.order_ref,
        o.checkout_mode,
        o.plan_id,
        o.estaciones_autorizadas,
        o.monto_autorizado_usd,
        o.payment_channel,
        o.status,
        o.voucher_ref,
        o.razon_social,
        o.ruc_cedula,
        (o.user_id is null) as can_claim_account,
        o.created_at,
        o.updated_at
    from public.orders o
    where o.order_ref = p_order_ref
      and lower(o.email) = lower(trim(p_email))
      and o.order_token_hash = encode(extensions.digest(convert_to(p_order_token, 'UTF8'), 'sha256'), 'hex')
    limit 1;
$$;

revoke all on function public.get_guest_order_status(text, text, text) from public, anon, authenticated;
grant execute on function public.get_guest_order_status(text, text, text) to service_role;
