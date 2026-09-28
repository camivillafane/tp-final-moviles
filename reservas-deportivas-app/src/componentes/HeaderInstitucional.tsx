import { Image, Pressable, StyleSheet, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { colores } from "@/constantes/colores";

interface HeaderInstitucionalProps {
  onPerfilPress?: () => void;
}

export function HeaderInstitucional({ onPerfilPress }: HeaderInstitucionalProps) {
  return (
    <View style={estilos.contenedor}>
      <Image
        source={require("../../assets/images/logo-municipio.png")}
        style={estilos.logo}
        resizeMode="contain"
      />
      <Pressable onPress={onPerfilPress} style={estilos.botonPerfil}>
        <IonIcons name="person-circle-outline" size={36} color={colores.verdePrincipal} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    backgroundColor: colores.fondo,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    height: 48,
    width: 140,
  },
  botonPerfil: {
    padding: 4,
  },
});
