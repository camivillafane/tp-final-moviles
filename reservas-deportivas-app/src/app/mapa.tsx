import { Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { colores } from "@/constantes/colores";

export default function Mapa() {
  const router = useRouter();

  return (
    <View style={estilos.contenedor}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
      <View style={estilos.contenido}>
        <Text style={estilos.texto}>Mapa de espacios deportivos</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: colores.fondo,
    flex: 1,
  },
  contenido: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  texto: {
    color: colores.textoOscuro,
    fontSize: 18,
  },
});
