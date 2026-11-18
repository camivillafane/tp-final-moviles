import type { Espacio } from "@/tipos/espacio";
import type { RespuestaLista } from "@/tipos/api";
import { espaciosMock } from "@/mocks/espacios";
import { USAR_MOCKS } from "./config";
import { getLista, getUno } from "./cliente";
import { ErrorServicio } from "./errores";
import { listaMock, respuestaMock } from "./mock";
import { obtenerIdEspacioApi } from "./mapeoEspacios";
import { estaSinConexion } from "@/servicios/conexion";
import {
  guardarEspaciosCache,
  obtenerEspaciosCache,
} from "@/servicios/cacheEspacios";

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

    return new Map(
      datos.map((espacio) => [espacio.id, espacio.precioPorHora])
    );
  } catch {
    return new Map();
  }
}

function generarClaveCache(filtros: FiltrosEspacios): string {
  const filtrosOrdenados = Object.entries(filtros).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  return JSON.stringify(filtrosOrdenados);
}

export async function listarEspacios(
  filtros: FiltrosEspacios = {}
): Promise<RespuestaLista<Espacio>> {
  if (!USAR_MOCKS) {
    const clave = generarClaveCache(filtros);

    // Sin conexión: consultar SQLite directamente.
    if (await estaSinConexion()) {
      const cache = await obtenerEspaciosCache(clave);

      if (cache) {
        return cache;
      }

      throw new ErrorServicio(
        "ERROR_RED",
        "No hay conexión y todavía no se guardó el catálogo de espacios en este dispositivo."
      );
    }

    try {
      const respuesta = await getLista<Espacio>(
        "/espacios",
        filtros as Record<string, unknown>
      );

      // Si falla el guardado local, no interrumpimos la respuesta online.
      try {
        await guardarEspaciosCache(clave, respuesta);
      } catch (error) {
        if (__DEV__) {
          console.warn("No se pudo guardar el catálogo offline:", error);
        }
      }

      return respuesta;
    } catch (error) {
      // Si falla la API por un problema de red, usamos SQLite.
      if (
        error instanceof ErrorServicio &&
        error.codigo === "ERROR_RED"
      ) {
        const cache = await obtenerEspaciosCache(clave);

        if (cache) {
          return cache;
        }
      }

      throw error;
    }
  }

  // Modo mocks.
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
    datos = datos.filter(
      (espacio) => espacio.deporteId === filtros.deporteId
    );
  }

  if (filtros.complejo) {
    datos = datos.filter(
      (espacio) => espacio.complejo === filtros.complejo
    );
  }

  if (filtros.iluminacion !== undefined) {
    datos = datos.filter(
      (espacio) => espacio.iluminacion === filtros.iluminacion
    );
  }

  if (filtros.techado !== undefined) {
    datos = datos.filter(
      (espacio) => espacio.techado === filtros.techado
    );
  }

  return listaMock(datos, filtros.pagina, filtros.porPagina);
}

export async function getEspacioById(
  id: string
): Promise<Espacio | null> {
  if (USAR_MOCKS) {
    const espacio =
      espaciosMock.find((item) => item.id === id) ?? null;

    if (!espacio) return respuestaMock(null);

    const idApi = obtenerIdEspacioApi(id);
    if (!idApi) return respuestaMock(espacio);

    try {
      const espacioApi = await getUno<Espacio>(`/espacios/${idApi}`);

      return respuestaMock({
        ...espacio,
        precioPorHora: espacioApi.precioPorHora,
      });
    } catch {
      return respuestaMock(espacio);
    }
  }

  try {
    return await getUno<Espacio>(`/espacios/${id}`);
  } catch (error) {
    if (
      error instanceof ErrorServicio &&
      error.codigo === "ESPACIO_NO_ENCONTRADO"
    ) {
      return null;
    }

    throw error;
  }
}
