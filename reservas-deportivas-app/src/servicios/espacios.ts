import type { Espacio } from "@/tipos/espacio";
import type { RespuestaLista } from "@/tipos/api";
import { espaciosMock } from "@/mocks/espacios";
import { USAR_MOCKS } from "./config";
import { getLista, getUno } from "./cliente";
import { ErrorServicio } from "./errores";
import { listaMock, respuestaMock } from "./mock";

interface FiltrosEspacios {
  pagina?: number;
  porPagina?: number;
  deporteId?: string;
  complejo?: string;
  iluminacion?: boolean;
  techado?: boolean;
}

export async function listarEspacios(
  filtros: FiltrosEspacios = {}
): Promise<RespuestaLista<Espacio>> {
  if (!USAR_MOCKS) {
    return getLista<Espacio>("/espacios", filtros as Record<string, unknown>);
  }

  // La API devuelve solo los activos, así que el mock hace lo mismo.
  let datos = espaciosMock.filter((espacio) => espacio.activo);

  if (filtros.deporteId) {
    datos = datos.filter((espacio) => espacio.deporteId === filtros.deporteId);
  }
  if (filtros.complejo) {
    datos = datos.filter((espacio) => espacio.complejo === filtros.complejo);
  }
  if (filtros.iluminacion !== undefined) {
    datos = datos.filter((espacio) => espacio.iluminacion === filtros.iluminacion);
  }
  if (filtros.techado !== undefined) {
    datos = datos.filter((espacio) => espacio.techado === filtros.techado);
  }

  return listaMock(datos, filtros.pagina, filtros.porPagina);
}

export async function getEspacioById(id: string): Promise<Espacio | null> {
  if (USAR_MOCKS) {
    return respuestaMock(espaciosMock.find((espacio) => espacio.id === id) ?? null);
  }

  try {
    return await getUno<Espacio>(`/espacios/${id}`);
  } catch (error) {
    if (error instanceof ErrorServicio && error.codigo === "ESPACIO_NO_ENCONTRADO") {
      return null;
    }
    throw error;
  }
}
