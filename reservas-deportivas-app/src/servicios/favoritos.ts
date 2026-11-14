import type { Espacio } from "@/tipos/espacio";
import type { RespuestaLista } from "@/tipos/api";
import type { Usuario } from "@/tipos/usuario";
import { USAR_MOCKS } from "./config";
import { borrar, getUno, put } from "./cliente";
import { listarEspacios } from "./espacios";
import {
  obtenerFavoritosLocales,
  guardarFavoritoLocal,
  eliminarFavoritoLocal,
} from "@/servicios/dbServicios";

export async function listarFavoritos(
  usuarioId: string
): Promise<RespuestaLista<Espacio>> {
  const ids = USAR_MOCKS
    ? await obtenerFavoritosLocales(usuarioId)
    : (await getUno<Usuario>("/yo")).espaciosFavoritos;

  const { datos } = await listarEspacios({ porPagina: 100 });

  const favoritos = ids
    .map((id) => datos.find((espacio) => espacio.id === id))
    .filter((espacio): espacio is Espacio => espacio !== undefined);

  return {
    datos: favoritos,
    meta: {
      total: favoritos.length,
      pagina: 1,
      porPagina: Math.max(favoritos.length, 1),
    },
  };
}

export async function agregarFavorito(
  usuarioId: string,
  espacioId: string
): Promise<void> {
  if (USAR_MOCKS) {
    await guardarFavoritoLocal(usuarioId, espacioId);
    return;
  }

  await put<Usuario>(`/yo/espacios-favoritos/${espacioId}`);
}

export async function quitarFavorito(
  usuarioId: string,
  espacioId: string
): Promise<void> {
  if (USAR_MOCKS) {
    await eliminarFavoritoLocal(usuarioId, espacioId);
    return;
  }

  await borrar(`/yo/espacios-favoritos/${espacioId}`);
}