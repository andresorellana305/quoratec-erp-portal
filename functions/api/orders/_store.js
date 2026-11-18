/**
 * Almacén auxiliar en memoria para órdenes híbridas cuando Edge corre en modo pruebas
 * o sin SUPABASE_SERVICE_ROLE_KEY configurado en entorno local.
 */

const MEMORY_ORDERS = new Map();
const MAX_MEMORY_ORDERS = 2000;

export function guardarOrdenMemoria(record) {
    if (MEMORY_ORDERS.size > MAX_MEMORY_ORDERS) {
        MEMORY_ORDERS.clear();
    }
    MEMORY_ORDERS.set(record.order_ref, { ...record });
    return MEMORY_ORDERS.get(record.order_ref);
}

export function obtenerOrdenMemoria(orderRef) {
    return MEMORY_ORDERS.get(orderRef) || null;
}

export function actualizarOrdenMemoria(orderRef, patch) {
    const cur = MEMORY_ORDERS.get(orderRef);
    if (!cur) return null;
    const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
    MEMORY_ORDERS.set(orderRef, next);
    return next;
}
