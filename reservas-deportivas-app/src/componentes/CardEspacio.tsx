import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { Espacio } from "@/tipos/espacio";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { BotonCta } from "./BotonCta";

interface CardEspacioProps {
  espacio: Espacio;
  onVerDetalle: () => void;
}

export function CardEspacio({ espacio, onVerDetalle }: CardEspacioProps) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
  const imagen = espacio.imagenes[0];

  return (
    <View style={estilos.card}>
      {imagen ? (
        <Image source={{ uri: imagen }} style={estilos.imagen} resizeMode="cover" />
      ) : (
        <View style={[estilos.imagen, estilos.imagenVacia]}>
          <IonIcons name="image-outline" size={36} color={paleta.verdeGrisaceo} />
        </View>
      )}
      <View style={estilos.contenido}>
        <Text style={estilos.complejo}>{espacio.complejo}</Text>
        <Text style={estilos.nombre}>{espacio.nombre}</Text>

        <View style={estilos.fila}>
          <Text style={estilos.dato}>{espacio.superficie}</Text>
          <Text style={estilos.separador}>•</Text>
          <Text style={estilos.dato}>
            {espacio.iluminacion ? "Con iluminación" : "Sin iluminación"}
          </Text>
        </View>

        <View style={estilos.filaPrecio}>
          <Text style={estilos.precio}>
            {espacio.precioPorHora === 0
              ? "Gratis"
              : `$${espacio.precioPorHora.toLocaleString("es-AR")}/hora`}
          </Text>
          <BotonCta titulo="Ver detalle" onPress={onVerDetalle} />
        </View>
      </View>
    </View>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    card: {
      backgroundColor: paleta.superficie,
      borderColor: paleta.bordeSuave,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 16,
      overflow: "hidden",
    },
    imagen: {
      height: 160,
      width: "100%",
    },
    imagenVacia: {
      alignItems: "center",
      backgroundColor: paleta.superficieAlt,
      justifyContent: "center",
    },
    contenido: {
      padding: 16,
    },
    complejo: {
      color: paleta.verdeGrisaceo,
      fontSize: 13,
      marginBottom: 2,
      textTransform: "uppercase",
    },
    nombre: {
      color: paleta.textoOscuro,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
    },
    fila: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: 12,
    },
    dato: {
      color: paleta.verdeSecundario,
      fontSize: 14,
    },
    separador: {
      color: paleta.borde,
      fontSize: 14,
      marginHorizontal: 8,
    },
    filaPrecio: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    precio: {
      color: paleta.verdePrincipal,
      fontSize: 16,
      fontWeight: "700",
    },
  });
