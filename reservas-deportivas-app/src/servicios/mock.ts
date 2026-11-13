import { DEMORA_MOCK_MS, SIMULAR_ERROR_RED } from "./config";
import { ErrorServicio } from "./errores";
import type { RespuestaLista } from "@/tipos/api";

const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, ms));

async function simular(demora: number) {
  await esperar(demora);

  if (SIMULAR_ERROR_RED) {
    throw new ErrorServicio("ERROR_RED", "No pudimos conectarnos. Revisá tu internet.");
  }
}

export async function respuestaMock<T>(
  datos: T,
  demora = DEMORA_MOCK_MS
): Promise<T> {
  await simular(demora);
  return datos;
}

export async function listaMock<T>(
  todos: T[],
  pagina = 1,
  porPagina = 20,
  demora = DEMORA_MOCK_MS
): Promise<RespuestaLista<T>> {
  await simular(demora);

  const desde = (pagina - 1) * porPagina;

  return {
    datos: todos.slice(desde, desde + porPagina),
    meta: { total: todos.length, pagina, porPagina },
  };
}
