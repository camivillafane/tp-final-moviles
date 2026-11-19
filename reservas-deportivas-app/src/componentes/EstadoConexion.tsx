import { useMemo } from "react";
import * as Network from "expo-network";
import { StyleSheet, Text, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

export function EstadoConexion() {
  const estado = Network.useNetworkState();
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  const sinInternet =
    estado.isInternetReachable === false || estado.isConnected === false;

  if (estado.isInternetReachable === true) {
    return null;
  }

  const mensaje = sinInternet
    ? "Sin conexión · tus reservas locales siguen disponibles"
    : "Comprobando conexión...";

  return (
    <View
      style={[estilos.barra, sinInternet ? estilos.sinInternet : estilos.verificando]}
      accessibilityLiveRegion="polite"
    >
      <IonIcons
        name={sinInternet ? "cloud-offline-outline" : "sync-outline"}
        size={16}
        color={sinInternet ? paleta.avisoTexto : paleta.verdeGrisaceo}
      />
      <Text
        style={[
          estilos.texto,
          sinInternet ? estilos.textoSinInternet : estilos.textoVerificando,
        ]}
      >
        {mensaje}
      </Text>
    </View>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    barra: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    sinInternet: {
      backgroundColor: paleta.avisoFondo,
    },
    verificando: {
      backgroundColor: paleta.superficieAlt,
    },
    texto: {
      fontSize: 13,
      textAlign: "center",
    },
    textoSinInternet: {
      color: paleta.avisoTexto,
    },
    textoVerificando: {
      color: paleta.verdeGrisaceo,
    },
  });
