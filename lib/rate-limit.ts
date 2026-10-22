/**
 * Rate limiting en memoria para acciones sensibles (login).
 *
 * Ventana deslizante simple por clave. Suficiente para una
 * instancia única del servidor (Next.js standalone / dev).
 * Si se escala a múltiples instancias, moverlo a BD o Redis.
 */

type Bucket = {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Limpia entradas expiradas y limita el tamaño del mapa
 * para evitar crecimiento de memoria indefinido.
 */
function limpiar() {
  const ahora = Date.now();

  for (const [clave, bucket] of buckets) {
    if (bucket.resetAt <= ahora) {
      buckets.delete(clave);
    }
  }

  if (buckets.size > 5000) {
    // Si por alguna razón quedaron muchas claves vivas,
    // eliminamos las más antiguas de forma arbitraria.
    const claves = buckets.keys();
    for (let i = 0; i < 2500; i++) {
      const siguiente = claves.next();
      if (siguiente.done) break;
      buckets.delete(siguiente.value);
    }
  }
}

/**
 * Indica si la clave aún puede usarse (sin consumir cupo).
 */
export function puedeIntentar(
  clave: string,
  maxIntentos: number,
  ventanaMs: number
): boolean {
  limpiar();

  const bucket = buckets.get(clave);

  if (!bucket || bucket.resetAt <= Date.now()) {
    return true;
  }

  return bucket.count < maxIntentos;
}

/**
 * Registra un intento fallido. Devuelve false si con este
 * intento se superó el límite.
 */
export function registrarIntento(
  clave: string,
  maxIntentos: number,
  ventanaMs: number
): boolean {
  limpiar();

  const ahora = Date.now();
  const bucket = buckets.get(clave);

  if (!bucket || bucket.resetAt <= ahora) {
    buckets.set(clave, { count: 1, resetAt: ahora + ventanaMs });
    return 1 <= maxIntentos;
  }

  bucket.count += 1;

  return bucket.count <= maxIntentos;
}

/**
 * Reinicia el contador de una clave (ej.: tras un login exitoso).
 */
export function limpiarIntentos(clave: string) {
  buckets.delete(clave);
}

/**
 * Extrae la IP del cliente desde los headers de la request.
 */
export function obtenerIp(headersGetter: {
  get(name: string): string | null;
}): string {
  const xff = headersGetter.get("x-forwarded-for");

  if (xff) {
    const primera = xff.split(",")[0]?.trim();
    if (primera) return primera;
  }

  const real = headersGetter.get("x-real-ip");
  if (real) return real.trim();

  return "local";
}
