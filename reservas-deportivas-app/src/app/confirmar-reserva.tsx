import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getEspacioById } from "@/servicios/espacios";
import { crearReserva } from "@/servicios/reservas";
import { guardarReservaLocal } from "@/servicios/dbServicios";
import { useSesion } from "@/contextos/Sesion";
import { EstadoConexion } from "@/componentes/EstadoConexion";
import type { Espacio } from "@/tipos/espacio";

export default function ConfirmarReservaPantalla() {
  const router = useRouter();
  const { usuario } = useSesion();
  const params = useLocalSearchParams<{
    turnoId: string;
    espacioId: string;
    fecha: string;
    inicio: string;
    fin: string;
  }>();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [cargandoEspacio, setCargandoEspacio] = useState(true);
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(1);
  const [cargando,setCargando] = useState(false);

  useEffect(() => {
    let activo = true;

    getEspacioById(params.espacioId)
      .then((resultado) => {
        if (activo) setEspacio(resultado);
      })
      .catch(() => {
        if (activo) setEspacio(null);
      })
      .finally(() => {
        if (activo) setCargandoEspacio(false);
      });

    return () => {
      activo = false;
    };
  }, [params.espacioId]);

  if (cargandoEspacio) {
    return (
      <SafeAreaView style={estilos.contenedorCentrado}>
        <Text>Cargando espacio...</Text>
      </SafeAreaView>
    );
  }

  if (!espacio) {
    return (
      <SafeAreaView style={estilos.contenedorCentrado}>
        <Text style={estilos.textoError}>Espacio no encontrado.</Text>
      </SafeAreaView>
    );
  }

  
  const [horaInicio] = (params.inicio || "00:00").split(":").map(Number);
  const [horaFin] = (params.fin || "00:00").split(":").map(Number);
  const duracionHoras = Math.max(1, horaFin - horaInicio);
  const precioTotal = duracionHoras * espacio.precioPorHora;

  const incrementarPersonas = () => {
    if (cantidadPersonas < espacio.capacidad) {
      setCantidadPersonas((prev) => prev + 1);
    }
  };

  const decrementarPersonas = () => {
    if (cantidadPersonas > 1) {
      setCantidadPersonas((prev) => prev - 1);
    }
  };

  const handleConfirmar = async () => {
    try {
  setCargando(true);

  if (!usuario) {
    throw new Error("Debés iniciar sesión para reservar.");
  }

  const nuevaReserva = await crearReserva(
    {
      turnoId: params.turnoId || "",
      espacioId: espacio.id,
      fecha: params.fecha || "",
      inicio: params.inicio || "",
      fin: params.fin || "",
      precio: espacio.precioPorHora,
      cantidadPersonas,
    },
    usuario.id
  );

  await guardarReservaLocal(nuevaReserva);

      Alert.alert(
        "¡Reserva confirmada!",
        "Tu reserva ha sido guardada con éxito y podés acceder a tu QR sin conexión.",
        [
          {
            text: "Aceptar",
            onPress: () => router.replace("/" as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("No se pudo reservar", error.message || "Ocurrió un error.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <EstadoConexion />
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.titulo}>Confirmar Reserva</Text>

        <View style={estilos.tarjeta}>
          <Text style={estilos.nombreEspacio}>{espacio.nombre}</Text>
          <Text style={estilos.complejo}>{espacio.complejo}</Text>

          <View style={estilos.divisor} />

          <Text style={estilos.etiqueta}>Fecha y Hora</Text>
          <Text style={estilos.valor}>
            {params.fecha} | {params.inicio} a {params.fin} hs
          </Text>

          <View style={estilos.divisor} />

          {/* Selector de Cantidad de Personas */}
          <Text style={estilos.etiqueta}>
            Cantidad de personas (Máx: {espacio.capacidad})
          </Text>
          <View style={estilos.selectorPersonas}>
            <TouchableOpacity
              style={[
                estilos.botonContador,
                cantidadPersonas <= 1 && estilos.botonDeshabilitado,
              ]}
              onPress={decrementarPersonas}
              disabled={cantidadPersonas <= 1}
            >
              <Text style={estilos.textoBotonContador}>-</Text>
            </TouchableOpacity>

            <Text style={estilos.valorPersonas}>{cantidadPersonas}</Text>

            <TouchableOpacity
              style={[
                estilos.botonContador,
                cantidadPersonas >= espacio.capacidad &&
                  estilos.botonDeshabilitado,
              ]}
              onPress={incrementarPersonas}
              disabled={cantidadPersonas >= espacio.capacidad}
            >
              <Text style={estilos.textoBotonContador}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={estilos.divisor} />

          {/* Resumen de Precio */}
          <View style={estilos.filaPrecio}>
            <Text style={estilos.etiquetaPrecio}>Total a pagar:</Text>
            <Text style={estilos.valorPrecio}>${precioTotal.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[estilos.botonConfirmar, cargando && estilos.botonDeshabilitado]}
          onPress={handleConfirmar}
          disabled={cargando}
        >
          <Text style={estilos.textoBotonConfirmar}>
            {cargando ? "Guardando..." : "Confirmar Reserva"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contenedorCentrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contenido: {
    padding: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 20,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  nombreEspacio: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  complejo: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  divisor: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  etiqueta: {
    fontSize: 13,
    color: "#888888",
    marginBottom: 4,
  },
  valor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  selectorPersonas: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  botonContador: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  textoBotonContador: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  valorPersonas: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 20,
    color: "#1A1A1A",
  },
  filaPrecio: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  etiquetaPrecio: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  valorPrecio: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  botonConfirmar: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonConfirmar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  textoError: {
    fontSize: 16,
    color: "red",
  },
});
