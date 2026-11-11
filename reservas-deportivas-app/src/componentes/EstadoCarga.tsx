import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colores } from "@/constantes/colores";

interface EstadoCargaProps {
  mensaje?: string;
}

export function EstadoCarga({ mensaje = "Cargando..." }: EstadoCargaProps) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={colores.verdePrincipal} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
    </View>
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
