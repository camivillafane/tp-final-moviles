import * as Network from "expo-network";
import { StyleSheet, Text, View } from "react-native";

export function EstadoConexion() {
  const estado = Network.useNetworkState();

  const sinInternet =
    estado.isInternetReachable === false || estado.isConnected === false;

  const mensaje =
    estado.isInternetReachable === true
      ? "Con conexión a internet"
      : sinInternet
        ? "Sin internet · tus reservas locales siguen disponibles"
        : estado.isConnected === true
          ? "Conectado a la red · verificando internet"
          : "Comprobando conexión...";

  return (
    <View
      style={[
        estilos.barra,
        sinInternet ? estilos.sinInternet : estilos.conInternet,
      ]}
    >
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  conInternet: {
    backgroundColor: "#E8F5E9",
  },
  sinInternet: {
    backgroundColor: "#FFF3E0",
  },
  texto: {
    color: "#333333",
    fontSize: 13,
    textAlign: "center",
  },
});