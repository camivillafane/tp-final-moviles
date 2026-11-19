import type { Espacio } from "@/tipos/espacio";
import { getLista, patch } from "./cliente";

export async function listarEspaciosAdministracion(): Promise<Espacio[]> {
  const respuesta = await getLista<Espacio>("/espacios", {
    pagina: 1,
    porPagina: 100,
  });
  return respuesta.datos;
}

export function cambiarPrecioEspacio(id: string, precioPorHora: number) {
  return patch<Espacio>(`/espacios/${id}`, { precioPorHora });
}
