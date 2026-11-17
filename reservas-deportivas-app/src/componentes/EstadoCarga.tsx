import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colores } from "@/constantes/colores";

interface EstadoCargaProps {
  mensaje?: string;
}

export function EstadoCarga({ mensaje = "Cargando..." }: EstadoCargaProps) {
  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <ActivityIndicator size="large" color={colores.verdePrincipal} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  mensaje: {
    color: colores.verdeGrisaceo,
    fontSize: 16,
    marginTop: 12,
  },
});
