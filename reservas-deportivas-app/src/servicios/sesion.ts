import * as SecureStore from "expo-secure-store";
import type { Usuario } from "@/tipos/usuario";

const CLAVE_SESION = "usuario_sesion";
const CLAVE_TOKEN = "token_api";
const CLAVE_TOKEN_BIOMETRICO = "token_api_biometrico";
const CLAVE_BIOMETRIA_ACTIVA = "biometria_activa";
const CLAVE_USUARIO_BIOMETRICO = "usuario_biometrico";

export async function guardarSesion(usuario: Usuario): Promise<void> {
    await SecureStore.setItemAsync(
        CLAVE_SESION,
        JSON.stringify(usuario)
    );
}

export async function guardarToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(CLAVE_TOKEN, token);
}

export async function recuperarToken(): Promise<string | null> {
    return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function guardarTokenBiometrico(token: string): Promise<void> {
    await SecureStore.setItemAsync(CLAVE_TOKEN_BIOMETRICO, token);
}

export async function recuperarTokenBiometrico(): Promise<string | null> {
    return SecureStore.getItemAsync(CLAVE_TOKEN_BIOMETRICO);
}

export async function actualizarCredencialesBiometricas(
    token: string,
    usuario: Usuario
): Promise<void> {
    const biometriaActiva = await SecureStore.getItemAsync(CLAVE_BIOMETRIA_ACTIVA);

    if (biometriaActiva === "true") {
        await guardarTokenBiometrico(token);
        await SecureStore.setItemAsync(
            CLAVE_USUARIO_BIOMETRICO,
            JSON.stringify(usuario)
        );
    }
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

export async function eliminarToken(): Promise<void> {
    await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}