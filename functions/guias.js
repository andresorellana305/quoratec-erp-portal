/**
 * Ruta limpia /guias -> /guia-uso.html (Centro de Video-Guías QuoraTec ERP v3.0.0)
 */
export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    url.pathname = "/guia-uso.html";
    return context.env.ASSETS.fetch(new Request(url.toString(), context.request));
}
