import type { Espacio } from "@/tipos/espacio";
import type { RespuestaLista } from "@/tipos/api";
import type { Usuario } from "@/tipos/usuario";
import { sesionMock } from "@/mocks/sesionUsuario";
import { USAR_MOCKS } from "./config";
import { borrar, getUno, put } from "./cliente";
import { respuestaMock } from "./mock";
import { listarEspacios } from "./espacios";

export async function listarFavoritos(): Promise<RespuestaLista<Espacio>> {
  const ids = USAR_MOCKS
    ? sesionMock?.espaciosFavoritos ?? []
    : (await getUno<Usuario>("/yo")).espaciosFavoritos;

  const { datos } = await listarEspacios({ porPagina: 100 });

  // Recorremos los ids para respetar el orden en que los agregó el usuario.
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

export async function agregarFavorito(espacioId: string): Promise<void> {
  if (!USAR_MOCKS) {
    await put<Usuario>(`/yo/espacios-favoritos/${espacioId}`);
    return;
  }

  if (sesionMock && !sesionMock.espaciosFavoritos.includes(espacioId)) {
    sesionMock.espaciosFavoritos.push(espacioId);
  }

  await respuestaMock(null);
}

export async function quitarFavorito(espacioId: string): Promise<void> {
  if (!USAR_MOCKS) {
    await borrar(`/yo/espacios-favoritos/${espacioId}`);
    return;
  }

  if (sesionMock) {
    sesionMock.espaciosFavoritos = sesionMock.espaciosFavoritos.filter(
      (id) => id !== espacioId
    );
  }

  await respuestaMock(null);
}
