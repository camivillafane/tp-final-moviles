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
  guardarCatalogo,
  obtenerCatalogo,
} from "@/servicios/catalogoCache";
import { aplicarMediosEspacios } from "@/servicios/mediosEspacios";

interface FiltrosEspacios {
  pagina?: number;
  porPagina?: number;
  deporteId?: string;
  complejo?: string;
  iluminacion?: boolean;
  techado?: boolean;
}

const CANTIDAD_MAXIMA_CATALOGO = 100;

function filtrarEspacios(
  espacios: Espacio[],
  filtros: FiltrosEspacios
): Espacio[] {
  let datos = espacios.filter((espacio) => espacio.activo);

  if (filtros.deporteId) {
    datos = datos.filter(
      (espacio) => espacio.deporteId === filtros.deporteId
    );
  }

  if (filtros.complejo) {
    datos = datos.filter(
      (espacio) =>
        espacio.complejo
          .toLowerCase()
          .includes(filtros.complejo!.toLowerCase())
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

  return datos;
}

function paginarEspacios(
  datos: Espacio[],
  filtros: FiltrosEspacios
): RespuestaLista<Espacio> {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.max(1, filtros.porPagina ?? 10);
  const inicio = (pagina - 1) * porPagina;

  return {
    datos: datos.slice(inicio, inicio + porPagina),
    meta: {
      total: datos.length,
      pagina,
      porPagina,
    },
  };
}

async function obtenerCatalogoEspacios(): Promise<Espacio[]> {
  const respuesta = await getLista<Espacio>("/espacios", {
    pagina: 1,
    porPagina: CANTIDAD_MAXIMA_CATALOGO,
  });

  await guardarCatalogo("espacios", respuesta.datos);

  return respuesta.datos;
}

async function obtenerEspaciosGuardados(): Promise<Espacio[] | null> {
  return obtenerCatalogo<Espacio[]>("espacios");
}

async function preciosApiPorEspacio(): Promise<Map<string, number>> {
  try {
    const { datos } = await getLista<Espacio>("/espacios", {
      pagina: 1,
      porPagina: CANTIDAD_MAXIMA_CATALOGO,
    });

    return new Map(
      datos.map((espacio) => [espacio.id, espacio.precioPorHora])
    );
  } catch {
    return new Map();
  }
}

export async function listarEspacios(
  filtros: FiltrosEspacios = {}
): Promise<RespuestaLista<Espacio>> {
  if (USAR_MOCKS) {
    let datos = espaciosMock.filter((espacio) => espacio.activo);

    if (!(await estaSinConexion())) {
      const preciosApi = await preciosApiPorEspacio();

      datos = datos.map((espacio) => {
        const idApi = obtenerIdEspacioApi(espacio.id);
        const precioApi = idApi ? preciosApi.get(idApi) : undefined;

        return precioApi === undefined
          ? espacio
          : { ...espacio, precioPorHora: precioApi };
      });
    }

    return paginarEspacios(filtrarEspacios(datos, filtros), filtros);
  }

  let espacios: Espacio[] | null = null;

  if (await estaSinConexion()) {
    espacios = await obtenerEspaciosGuardados();
  } else {
    try {
      espacios = await obtenerCatalogoEspacios();
    } catch (error) {
      if (
        error instanceof ErrorServicio &&
        error.codigo === "ERROR_RED"
      ) {
        espacios = await obtenerEspaciosGuardados();
      } else {
        throw error;
      }
    }
  }

  if (!espacios) {
    throw new ErrorServicio(
      "ERROR_RED",
      "No hay conexión y todavía no se guardó el catálogo de espacios en este dispositivo."
    );
  }

  const conMedios = await aplicarMediosEspacios(espacios);

  return paginarEspacios(filtrarEspacios(conMedios, filtros), filtros);
}

async function obtenerEspacioBase(
  id: string
): Promise<Espacio | null> {
  if (USAR_MOCKS) {
    const espacio =
      espaciosMock.find((item) => item.id === id) ?? null;

    if (!espacio) return respuestaMock(null);

    const idApi = obtenerIdEspacioApi(id);

    if (!idApi || (await estaSinConexion())) {
      return respuestaMock(espacio);
    }

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

  if (await estaSinConexion()) {
    const espacios = await obtenerEspaciosGuardados();

    if (!espacios) {
      throw new ErrorServicio(
        "ERROR_RED",
        "No hay conexión y todavía no se guardó este espacio en el dispositivo."
      );
    }

    return espacios.find((espacio) => espacio.id === id) ?? null;
  }

  try {
    const espacio = await getUno<Espacio>(`/espacios/${id}`);

    // Actualizamos también el espacio individual dentro del catálogo local.
    try {
      const espacios = (await obtenerEspaciosGuardados()) ?? [];
      const indice = espacios.findIndex((item) => item.id === id);

      if (indice >= 0) {
        espacios[indice] = espacio;
      } else {
        espacios.push(espacio);
      }

      await guardarCatalogo("espacios", espacios);
    } catch (error) {
      if (__DEV__) {
        console.warn("No se pudo actualizar el espacio en caché:", error);
      }
    }

    return espacio;
  } catch (error) {
    if (
      error instanceof ErrorServicio &&
      error.codigo === "ESPACIO_NO_ENCONTRADO"
    ) {
      return null;
    }

    if (
      error instanceof ErrorServicio &&
      error.codigo === "ERROR_RED"
    ) {
      const espacios = await obtenerEspaciosGuardados();

      if (espacios) {
        return espacios.find((espacio) => espacio.id === id) ?? null;
      }
    }

    throw error;
  }
}

export async function getEspacioById(
  id: string
): Promise<Espacio | null> {
  const espacio = await obtenerEspacioBase(id);

  if (!espacio) return null;

  const [conMedios] = await aplicarMediosEspacios([espacio]);

  return conMedios;
}
