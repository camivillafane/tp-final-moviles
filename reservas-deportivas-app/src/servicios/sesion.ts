import type { Usuario } from "@/tipos/usuario";
import { sesionMock } from "@/mocks/sesionUsuario";
import { USAR_MOCKS } from "./config";
import { getUno } from "./cliente";
import { ErrorServicio } from "./errores";
import { respuestaMock } from "./mock";

// La API puede devolver "administrador". La app solo maneja dos roles,
// así que lo tratamos como encargado.
type UsuarioApi = Omit<Usuario, "rol"> & { rol: string };

export async function getSesion(): Promise<Usuario | null> {
  if (USAR_MOCKS) {
    return respuestaMock(sesionMock, 0);
  }

  try {
    const api = await getUno<UsuarioApi>("/yo");
    return {
      ...api,
      rol: api.rol === "jugador" ? "jugador" : "encargado",
    };
  } catch (error) {
    if (error instanceof ErrorServicio && error.codigo === "NO_AUTENTICADO") {
      return null;
    }
    throw error;
  }
}
