import { Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colores } from "@/constantes/colores";

export default function DetalleEspacio() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>Detalle del espacio {id}</Text>
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
