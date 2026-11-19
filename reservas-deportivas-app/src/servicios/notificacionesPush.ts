import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { post } from "@/servicios/cliente";
import { recuperarToken } from "@/servicios/sesion";
import { solicitarPermisoNotificaciones } from "@/servicios/notificacionesLocales";
import type { Dispositivo } from "@/tipos/api";

const CLAVE_TOKEN_DISPOSITIVO_PUSH = "token_dispositivo_push";

export async function registrarDispositivoPush(): Promise<Dispositivo | null> {
  const tokenSesion = await recuperarToken();
  if (!tokenSesion) {
    throw new Error("Iniciá sesión antes de registrar las notificaciones push.");
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error(
      "Para registrar notificaciones push, abrí la development build instalada; Expo Go no admite push remotas en Android."
    );
  }
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    throw new Error("El registro de notificaciones push requiere Android o iOS.");
  }

  const permisoConcedido = await solicitarPermisoNotificaciones();
  if (!permisoConcedido) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error("No se encontró el projectId de EAS en la configuración de Expo.");
  }

  const { data: tokenExpo } = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!tokenExpo) throw new Error("Expo no devolvió un token push para este dispositivo.");

  const plataforma: Dispositivo["plataforma"] = Platform.OS === "ios" ? "ios" : "android";
  const dispositivo = await post<Dispositivo>("/dispositivos", {
    tokenExpo,
    plataforma,
  });

  await SecureStore.setItemAsync(CLAVE_TOKEN_DISPOSITIVO_PUSH, tokenExpo);
  return dispositivo;
}

export async function recuperarTokenDispositivoPush(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN_DISPOSITIVO_PUSH);
}
