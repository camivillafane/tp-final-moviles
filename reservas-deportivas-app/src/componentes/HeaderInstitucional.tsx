import { Image, Pressable, StyleSheet, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { colores } from "@/constantes/colores";

interface HeaderInstitucionalProps {
  onPerfilPress?: () => void;
  mostrarVolver?: boolean;
  onVolverPress?: () => void;
}

export function HeaderInstitucional({
  onPerfilPress,
  mostrarVolver = false,
  onVolverPress,
}: HeaderInstitucionalProps) {
  return (
    <View style={estilos.contenedor}>
      <View style={estilos.lado}>
        {mostrarVolver && onVolverPress ? (
          <Pressable onPress={onVolverPress} style={estilos.boton}>
            <IonIcons name="arrow-back" size={26} color={colores.verdePrincipal} />
          </Pressable>
        ) : (
          <View style={estilos.boton} />
        )}
      </View>

      <View style={estilos.centro}>
        <Image
          source={require("../../assets/images/logovillaguaydeportes.png")}
          style={estilos.logo}
          resizeMode="contain"
        />
      </View>

      <View style={[estilos.lado, estilos.ladoDerecho]}>
        <Pressable onPress={onPerfilPress} style={estilos.boton}>
          <IonIcons name="person-circle-outline" size={36} color={colores.verdePrincipal} />
        </Pressable>
      </View>
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
  lado: {
    alignItems: "flex-start",
    flex: 1,
  },
  ladoDerecho: {
    alignItems: "flex-end",
  },
  centro: {
    alignItems: "center",
    flex: 2,
  },
  logo: {
    height: 48,
    width: 140,
  },
  boton: {
    height: 40,
    justifyContent: "center",
    width: 40,
  },
});
