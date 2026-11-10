/*Este módulo se encarga de hacer todas las peticiones al backend de forma segura 
y atrapará los errores con la clase ApiError */

export class ApiError extends Error { //clase 09
  constructor(status, body) {
    super(body?.detail ?? `Error HTTP ${status}`);
    this.status = status; // 0: no hubo respuesta
    this.fieldErrors = body?.errores ?? [];
  }
}
export async function api(url, { method = "GET", body, signal } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      body: body && JSON.stringify(body),
      headers: body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(0, { detail: "No se pudo contactar al servidor" });
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
