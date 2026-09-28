import { Text, View, StyleSheet } from "react-native";
import { colores } from "@/constantes/colores";

export default function Mapa() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>Mapa de espacios deportivos</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    backgroundColor: colores.fondo,
    flex: 1,
    justifyContent: "center",
  },
  texto: {
    color: colores.textoOscuro,
    fontSize: 18,
  },
});
