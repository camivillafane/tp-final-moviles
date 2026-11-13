import * as SecureStore from "expo-secure-store";
import type { Usuario } from "@/tipos/usuario";

const CLAVE_SESION = "usuario_sesion";

export async function guardarSesion(usuario: Usuario): Promise<void> {
    await SecureStore.setItemAsync(
        CLAVE_SESION,
        JSON.stringify(usuario)
    );
}

export async function recuperarSesion(): Promise<Usuario | null> {
    const datos = await SecureStore.getItemAsync(CLAVE_SESION);

    if (!datos) return null;

    try {
        return JSON.parse(datos) as Usuario;
    } catch {
        await SecureStore.deleteItemAsync(CLAVE_SESION);
        return null;
    }
}

export async function eliminarSesion(): Promise<void> {
    await SecureStore.deleteItemAsync(CLAVE_SESION);
}