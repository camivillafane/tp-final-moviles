import type { Espacio } from "@/tipos/espacio";
import type { RespuestaLista } from "@/tipos/api";
import { espaciosMock } from "@/mocks/espacios";
import { USAR_MOCKS } from "./config";
import { getLista, getUno } from "./cliente";
import { ErrorServicio } from "./errores";
import { listaMock, respuestaMock } from "./mock";
import { obtenerIdEspacioApi } from "./mapeoEspacios";

interface FiltrosEspacios {
  pagina?: number;
  porPagina?: number;
  deporteId?: string;
  complejo?: string;
  iluminacion?: boolean;
  techado?: boolean;
}

async function preciosApiPorEspacio(): Promise<Map<string, number>> {
  try {
    const { datos } = await getLista<Espacio>("/espacios", {
      pagina: 1,
      porPagina: 100,
    });
    return new Map(datos.map((espacio) => [espacio.id, espacio.precioPorHora]));
  } catch {
    // Sin conexión, la exploración conserva los precios mock locales.
    return new Map();
  }
}

export async function listarEspacios(
  filtros: FiltrosEspacios = {}
): Promise<RespuestaLista<Espacio>> {
  if (!USAR_MOCKS) {
    return getLista<Espacio>("/espacios", filtros as Record<string, unknown>);
  }

  // La API devuelve solo los activos, así que el mock hace lo mismo.
  let datos = espaciosMock.filter((espacio) => espacio.activo);

  const preciosApi = await preciosApiPorEspacio();
  datos = datos.map((espacio) => {
    const idApi = obtenerIdEspacioApi(espacio.id);
    const precioApi = idApi ? preciosApi.get(idApi) : undefined;
    return precioApi === undefined
      ? espacio
      : { ...espacio, precioPorHora: precioApi };
  });

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
    const espacio = espaciosMock.find((item) => item.id === id) ?? null;
    if (!espacio) return respuestaMock(null);

    const idApi = obtenerIdEspacioApi(id);
    if (!idApi) return respuestaMock(espacio);

    try {
      const espacioApi = await getUno<Espacio>(`/espacios/${idApi}`);
      return respuestaMock({ ...espacio, precioPorHora: espacioApi.precioPorHora });
    } catch {
      return respuestaMock(espacio);
    }
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
