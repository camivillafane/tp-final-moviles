import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import type { Usuario } from "@/tipos/usuario";
import {
  eliminarCredencialesBiometricas,
  estaBiometriaActiva,
  guardarTokenBiometrico,
  recuperarToken,
} from "@/servicios/sesion";

const CLAVE_BIOMETRIA_ACTIVA = "biometria_activa";
const CLAVE_USUARIO_BIOMETRICO = "usuario_biometrico";

export { estaBiometriaActiva };

export async function activarAccesoBiometrico(usuario: Usuario): Promise<boolean> {
  const disponible = await LocalAuthentication.hasHardwareAsync();
  const registrado = await LocalAuthentication.isEnrolledAsync();

  if (!disponible || !registrado) {
    throw new Error("Tu dispositivo no tiene biometría configurada.");
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirmá tu identidad",
  });

  if (!resultado.success) {
    return false;
  }

  const token = await recuperarToken();

  if (!token) {
    throw new Error("Iniciá sesión nuevamente antes de activar la biometría.");
  }

  await guardarTokenBiometrico(token);
  await SecureStore.setItemAsync(CLAVE_BIOMETRIA_ACTIVA, "true");
  await SecureStore.setItemAsync(CLAVE_USUARIO_BIOMETRICO, JSON.stringify(usuario));

  return true;
}

export async function desactivarAccesoBiometrico(): Promise<void> {
  await eliminarCredencialesBiometricas();
}
