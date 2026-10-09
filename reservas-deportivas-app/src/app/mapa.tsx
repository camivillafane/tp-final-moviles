import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Espacio } from "@/tipos/espacio";
import { EstadoCarga } from "@/componentes/EstadoCarga";
import { EstadoError } from "@/componentes/EstadoError";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { BotonCta } from "@/componentes/BotonCta";
import { colores } from "@/constantes/colores";
import { getEspacios } from "@/servicios/espacios";

const COORDENADAS_VILLAGUAY: Region = {
  latitude: -31.8642,
  longitude: -59.0281,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export default function Mapa() {
  const router = useRouter();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<Espacio | null>(null);
  const [estado, setEstado] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const espaciosActivos = useMemo(() => espacios.filter((e) => e.activo), [espacios]);

  const cargarMapa = async () => {
    setEstado("loading");
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let ubicacionUsuario: Location.LocationObject | null = null;

      if (status === "granted") {
        ubicacionUsuario = await Location.getCurrentPositionAsync({});
      }

      const datos = await getEspacios();
      setEspacios(datos);

      setRegion({
        latitude: ubicacionUsuario?.coords.latitude ?? COORDENADAS_VILLAGUAY.latitude,
        longitude: ubicacionUsuario?.coords.longitude ?? COORDENADAS_VILLAGUAY.longitude,
        latitudeDelta: COORDENADAS_VILLAGUAY.latitudeDelta,
        longitudeDelta: COORDENADAS_VILLAGUAY.longitudeDelta,
      });

      setEstado("success");
    } catch (e) {
      setError("No se pudo cargar el mapa. Intentá de nuevo.");
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarMapa();
  }, []);

  if (estado === "loading") {
    return <EstadoCarga mensaje="Cargando mapa..." />;
  }

  if (estado === "error") {
    return <EstadoError mensaje={error ?? "Ocurrió un error"} onReintentar={cargarMapa} />;
  }

  return (
    <View style={estilos.contenedor}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />

      <MapView
        style={estilos.mapa}
        initialRegion={region ?? COORDENADAS_VILLAGUAY}
        showsUserLocation
        showsMyLocationButton
      >
        {espaciosActivos.map((espacio) => (
          <Marker
            key={espacio.id}
            coordinate={{
              latitude: espacio.coordenadas.latitud,
              longitude: espacio.coordenadas.longitud,
            }}
            title={espacio.nombre}
            description={espacio.complejo}
            onPress={() => setEspacioSeleccionado(espacio)}
          />
        ))}
      </MapView>

      {espacioSeleccionado && (
        <View style={estilos.tarjeta}>
          <Text style={estilos.complejo}>{espacioSeleccionado.complejo}</Text>
          <Text style={estilos.nombre}>{espacioSeleccionado.nombre}</Text>

          <View style={estilos.fila}>
            <Text style={estilos.precio}>
              {espacioSeleccionado.precioPorHora === 0
                ? "Gratis"
                : `$${espacioSeleccionado.precioPorHora.toLocaleString("es-AR")}/hora`}
            </Text>
          </View>

          <BotonCta
            titulo="Ver detalle"
            onPress={() => {
              router.push({
                pathname: "/espacio/[id]",
                params: { id: espacioSeleccionado.id },
              });
              setEspacioSeleccionado(null);
            }}
          />

          <Pressable
            style={estilos.cerrar}
            onPress={() => setEspacioSeleccionado(null)}
          >
            <Text style={estilos.cerrarTexto}>Cerrar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: colores.fondo,
    flex: 1,
  },
  mapa: {
    flex: 1,
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderColor: colores.borde,
    borderRadius: 16,
    borderWidth: 1,
    bottom: 24,
    elevation: 5,
    left: 16,
    padding: 16,
    position: "absolute",
    right: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  complejo: {
    color: colores.verdeGrisaceo,
    fontSize: 13,
    textTransform: "uppercase",
  },
  nombre: {
    color: colores.textoOscuro,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  fila: {
    marginBottom: 12,
  },
  precio: {
    color: colores.verdePrincipal,
    fontSize: 16,
    fontWeight: "700",
  },
  cerrar: {
    alignItems: "center",
    marginTop: 12,
  },
  cerrarTexto: {
    color: colores.verdeGrisaceo,
    fontSize: 14,
    fontWeight: "500",
  },
});
