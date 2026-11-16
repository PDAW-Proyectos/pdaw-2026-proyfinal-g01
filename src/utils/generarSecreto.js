import { randomBytes } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Genera un secreto criptográficamente seguro codificado en hexadecimal.
 * Por defecto genera 32 bytes (256 bits -> 64 caracteres hexadecimales).
 * @param {number} [bytes=32] Cantidad de bytes aleatorios (mínimo 16).
 * @returns {string}
 */
export function generarSecreto(bytes = 32) {
  if (!Number.isInteger(bytes) || bytes < 16) {
    throw new RangeError("La cantidad de bytes debe ser un entero mayor o igual a 16.")
  }
  return randomBytes(bytes).toString("hex")
}

const ejecutadoDirectamente =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (ejecutadoDirectamente) {
  const bytesArg = process.argv[2] !== undefined ? Number(process.argv[2]) : 32
  console.log(generarSecreto(bytesArg))
}
