import { useMemo } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

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
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.lado}>
        {mostrarVolver && onVolverPress ? (
          <Pressable onPress={onVolverPress} style={estilos.boton}>
            <IonIcons name="arrow-back" size={26} color={paleta.verdePrincipal} />
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
        {onPerfilPress ? (
          <Pressable
            onPress={onPerfilPress}
            style={estilos.boton}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de perfil"
          >
            <IonIcons
              name="person-circle-outline"
              size={36}
              color={paleta.verdePrincipal}
            />
          </Pressable>
        ) : (
          <View style={estilos.boton} />
        )}
      </View>
    </View>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      alignItems: "center",
      backgroundColor: paleta.fondo,
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
