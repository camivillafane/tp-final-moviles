import type { Deporte } from "@/tipos/deporte";
import type { RespuestaLista } from "@/tipos/api";
import { deportesMock } from "@/mocks/deportes";
import { USAR_MOCKS } from "./config";
import { getLista } from "./cliente";
import { listaMock } from "./mock";
import { ErrorServicio } from "./errores";
import { estaSinConexion } from "@/servicios/conexion";
import {
  guardarCatalogo,
  obtenerCatalogo,
} from "@/servicios/catalogoCache";

export async function listarDeportes(): Promise<RespuestaLista<Deporte>> {
  if (USAR_MOCKS) {
    return listaMock(deportesMock, 1, 100);
  }

  if (await estaSinConexion()) {
    const cache = await obtenerCatalogo<RespuestaLista<Deporte>>(
      "deportes"
    );

    if (cache) return cache;

    throw new ErrorServicio(
      "ERROR_RED",
      "No hay conexión y todavía no se guardó el catálogo de deportes en este dispositivo."
    );
  }

  try {
    const respuesta = await getLista<Deporte>("/deportes");

    await guardarCatalogo("deportes", respuesta);

    return respuesta;
  } catch (error) {
    if (
      error instanceof ErrorServicio &&
      error.codigo === "ERROR_RED"
    ) {
      const cache = await obtenerCatalogo<RespuestaLista<Deporte>>(
        "deportes"
      );

      if (cache) return cache;
    }

    throw error;
  }
}
