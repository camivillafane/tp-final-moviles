import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { Espacio } from "@/tipos/espacio";
import { colores } from "@/constantes/colores";
import { BotonCta } from "./BotonCta";

interface CardEspacioProps {
  espacio: Espacio;
  onVerDisponibilidad: () => void;
}

export function CardEspacio({ espacio, onVerDisponibilidad }: CardEspacioProps) {
  const imagen = espacio.imagenes[0];

  return (
    <View style={estilos.card}>
      <Image source={{ uri: imagen }} style={estilos.imagen} resizeMode="cover" />
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
          <BotonCta titulo="Ver disponibilidad" onPress={onVerDisponibilidad} />
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: colores.blanco,
    borderColor: colores.borde,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  imagen: {
    height: 160,
    width: "100%",
  },
  contenido: {
    padding: 16,
  },
  complejo: {
    color: colores.verdeGrisaceo,
    fontSize: 13,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  nombre: {
    color: colores.textoOscuro,
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
    color: colores.verdeSecundario,
    fontSize: 14,
  },
  separador: {
    color: colores.borde,
    fontSize: 14,
    marginHorizontal: 8,
  },
  filaPrecio: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  precio: {
    color: colores.verdePrincipal,
    fontSize: 16,
    fontWeight: "700",
  },
});
