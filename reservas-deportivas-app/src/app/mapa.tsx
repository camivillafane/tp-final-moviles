import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import IonIcons from "@react-native-vector-icons/ionicons";

const COORDENADAS_VILLAGUAY: Region = {
  latitude: -31.8642,
  longitude: -59.0281,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export default function Mapa() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<Espacio | null>(null);
  const [tienePermiso, setTienePermiso] = useState(false);
  const [estado, setEstado] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const espaciosActivos = useMemo(() => espacios.filter((e) => e.activo), [espacios]);

  const cargarMapa = async () => {
    setEstado("loading");
    setError(null);

    try {
      const datos = await getEspacios();
      setEspacios(datos);
      setEstado("success");
    } catch (e) {
      setError("No se pudo cargar el mapa. Intentá de nuevo.");
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarMapa();
  }, []);

  const centrarEnMiUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setTienePermiso(false);
        Alert.alert(
          "Permiso denegado",
          "Necesitamos tu ubicación para centrar el mapa en vos. Podés activarlo desde los ajustes del sistema."
        );
        return;
      }

      setTienePermiso(true);

      const posicion = await Location.getCurrentPositionAsync({});
      const nuevaRegion: Region = {
        latitude: posicion.coords.latitude,
        longitude: posicion.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      mapRef.current?.animateToRegion(nuevaRegion, 600);    } catch (e) {
      Alert.alert(
        "No se pudo obtener tu ubicación",
        "Revisá que el GPS esté activado e intentá de nuevo."
      );
    }
  };

  const volverAVillaguay = () => {
    mapRef.current?.animateToRegion(COORDENADAS_VILLAGUAY, 600);
  };

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
        ref={mapRef}
        style={estilos.mapa}
        initialRegion={COORDENADAS_VILLAGUAY}
        showsUserLocation={tienePermiso}
        showsMyLocationButton={false}
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

      <View style={estilos.controles}>
        <Pressable style={estilos.botonControl} onPress={centrarEnMiUbicacion}>
          <IonIcons name="locate" size={22} color={colores.verdePrincipal} />
        </Pressable>
        <Pressable style={estilos.botonControl} onPress={volverAVillaguay}>
          <IonIcons name="home" size={22} color={colores.verdePrincipal} />
        </Pressable>
      </View>

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
  controles: {
    bottom: 24,
    position: "absolute",
    right: 16,
    top: 16,
  },
  botonControl: {
    alignItems: "center",
    backgroundColor: colores.blanco,
    borderColor: colores.borde,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 4,
    height: 44,
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: 44,
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
