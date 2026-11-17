import type { Bloqueo, ReservaFijaApi } from "@/tipos/api";
import { borrar, getLista, patch, post, postLista } from "./cliente";

export async function listarBloqueos(desde: string): Promise<Bloqueo[]> {
  const respuesta = await getLista<Bloqueo>("/bloqueos", {
    desde,
    pagina: 1,
    porPagina: 100,
  });
  return respuesta.datos;
}

export async function crearBloqueo(datos: {
  espacioIds: string[];
  fecha: string;
  inicio?: string;
  fin?: string;
  motivo: string;
}): Promise<Bloqueo[]> {
  const respuesta = await postLista<Bloqueo>("/bloqueos", datos);
  return respuesta.datos;
}

export function quitarBloqueo(id: string): Promise<void> {
  return borrar(`/bloqueos/${id}`);
}

export async function listarReservasFijas(): Promise<ReservaFijaApi[]> {
  const respuesta = await getLista<ReservaFijaApi>("/fijas", {
    pagina: 1,
    porPagina: 100,
  });
  return respuesta.datos;
}

export function crearReservaFija(datos: {
  espacioId: string;
  titular: string;
  dia: number;
  inicio: string;
  fin: string;
  desde: string;
  hasta?: string | null;
}): Promise<ReservaFijaApi> {
  return post<ReservaFijaApi>("/fijas", datos);
}

export function editarReservaFija(
  id: string,
  datos: Partial<Pick<ReservaFijaApi, "titular" | "dia" | "inicio" | "fin" | "desde" | "hasta" | "activa">>
): Promise<ReservaFijaApi> {
  return patch<ReservaFijaApi>(`/fijas/${id}`, datos);
}

export function darDeBajaReservaFija(id: string): Promise<void> {
  return borrar(`/fijas/${id}`);
}
