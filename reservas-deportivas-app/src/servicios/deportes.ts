import type { Deporte } from "@/tipos/deporte";
import type { RespuestaLista } from "@/tipos/api";
import { deportesMock } from "@/mocks/deportes";
import { USAR_MOCKS } from "./config";
import { getLista } from "./cliente";
import { listaMock } from "./mock";
import { estaSinConexion } from "@/servicios/conexion";

export async function listarDeportes(): Promise<RespuestaLista<Deporte>> {
  if (USAR_MOCKS || await estaSinConexion()) {
    return listaMock(deportesMock, 1, 100);
  }

  return getLista<Deporte>("/deportes");
}
