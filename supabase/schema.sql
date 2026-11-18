-- Esquema Supabase PostgreSQL + RLS para Checkout Híbrido, Licencias y Equipos (+1 PC Adicional)
-- TributaFlow ERP v3.0.0 — Edición 2026 (QUORATEC)

create extension if not exists pgcrypto;

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_ref text unique not null,
    order_token_hash text not null,
    checkout_mode text not null check (checkout_mode in ('guest', 'account')),
    user_id uuid references auth.users(id) on delete set null,
    email text not null,
    ruc_cedula text not null,
    razon_social text not null,
    plan_id text not null check (plan_id in ('PERSONAL_PRO', 'CONTADOR_MASTER', 'ESTUDIO_PRO', 'ENTERPRISE_TEAM', 'ENTERPRISE_CORP')),
    extra_seats integer not null default 0 check (extra_seats >= 0 and extra_seats <= 50),
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

create table if not exists public.licenses (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders(id) on delete set null,
    user_id uuid references auth.users(id) on delete set null,
    license_key text unique not null,
    plan_id text not null,
    ruc_cedula text not null,
    estaciones_autorizadas integer not null default 1,
    active_status text not null default 'activa' check (active_status in ('activa', 'solo_lectura', 'revocada')),
    issued_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create table if not exists public.license_devices (
    id uuid primary key default gen_random_uuid(),
    license_id uuid not null references public.licenses(id) on delete cascade,
    hwid text not null,
    etiqueta text,
    es_adicional boolean not null default false,
    linked_at timestamptz not null default now(),
    unique (license_id, hwid)
);

-- Seguridad RLS estricta (solo el titular autenticado consulta sus órdenes y equipos; invitados usan /api/orders/status con order_token)
alter table public.orders enable row level security;
alter table public.licenses enable row level security;
alter table public.license_devices enable row level security;

create policy "orders_owner_select"
    on public.orders for select
    to authenticated
    using (auth.uid() = user_id);

create policy "licenses_owner_select"
    on public.licenses for select
    to authenticated
    using (auth.uid() = user_id);

create policy "license_devices_owner_select"
    on public.license_devices for select
    to authenticated
    using (
        exists (
            select 1 from public.licenses l
            where l.id = license_devices.license_id and l.user_id = auth.uid()
        )
    );

-- RPC segura para consulta de orden en Modo Invitado validando obligatoriamente order_token + email.
-- Solo invocable por el backend Edge con service_role (sin acceso directo para anon/public).
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
      and o.order_token_hash = encode(digest(p_order_token, 'sha256'), 'hex')
    limit 1;
$$;

revoke all on function public.get_guest_order_status(text, text, text) from public, anon, authenticated;
grant execute on function public.get_guest_order_status(text, text, text) to service_role;
