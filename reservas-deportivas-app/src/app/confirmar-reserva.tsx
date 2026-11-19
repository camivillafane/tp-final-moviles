import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { getEspacioById } from "@/servicios/espacios";
import { crearReserva } from "@/servicios/reservas";
import { guardarReservaLocal } from "@/servicios/dbServicios";
import { useSesion } from "@/contextos/Sesion";
import { EstadoConexion } from "@/componentes/EstadoConexion";
import type { Espacio } from "@/tipos/espacio";
import { programarRecordatorioReserva } from "@/servicios/notificacionesLocales";

export default function ConfirmarReservaPantalla() {
  const router = useRouter();
  const { usuario } = useSesion();
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
  const params = useLocalSearchParams<{
    turnoId: string;
    espacioId: string;
    fecha: string;
    inicio: string;
    fin: string;
    precio?: string;
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
      <SafeAreaView style={estilos.contenedorCentrado} edges={["top", "bottom"]}>
        <Text>Cargando espacio...</Text>
      </SafeAreaView>
    );
  }

  if (!espacio) {
    return (
      <SafeAreaView style={estilos.contenedorCentrado} edges={["top", "bottom"]}>
        <Text style={estilos.textoError}>Espacio no encontrado.</Text>
      </SafeAreaView>
    );
  }

  
  const [horaInicio] = (params.inicio || "00:00").split(":").map(Number);
  const [horaFin] = (params.fin || "00:00").split(":").map(Number);
  const duracionHoras = Math.max(1, horaFin - horaInicio);
  const precioRecibido = Number(params.precio);
  const precioPorHora =
    params.precio !== undefined && Number.isFinite(precioRecibido)
      ? precioRecibido
      : espacio.precioPorHora;
  const precioTotal = duracionHoras * precioPorHora;

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

  if (usuario.rol !== "jugador") {
    throw new Error("Solo los jugadores pueden reservar turnos.");
  }

  const nuevaReserva = await crearReserva(
    {
      turnoId: params.turnoId || "",
      espacioId: espacio.id,
      fecha: params.fecha || "",
      inicio: params.inicio || "",
      fin: params.fin || "",
      precio: precioPorHora,
      cantidadPersonas,
    },
    usuario.id
  );

  await guardarReservaLocal(nuevaReserva);

  try {
    await programarRecordatorioReserva(nuevaReserva, espacio.nombre);
  } catch (error) {
    console.warn("La reserva se confirmó, pero no se pudo programar el recordatorio.", error);
  }

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
        <Pressable
          onPress={() => router.back()}
          style={estilos.botonVolver}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <IonIcons
            name="arrow-back"
            size={26}
            color={paleta.verdePrincipal}
          />
        </Pressable>

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

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: paleta.fondo,
    },
    contenedorCentrado: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: paleta.fondo,
    },
    contenido: {
      padding: 20,
    },
    botonVolver: {
      marginBottom: 16,
    },
    titulo: {
      fontSize: 22,
      fontWeight: "bold",
      color: paleta.textoOscuro,
      marginBottom: 20,
    },
    tarjeta: {
      backgroundColor: paleta.superficie,
      borderColor: paleta.bordeSuave,
      borderWidth: 1,
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
      color: paleta.textoOscuro,
    },
    complejo: {
      fontSize: 14,
      color: paleta.verdeGrisaceo,
      marginTop: 4,
    },
    divisor: {
      height: 1,
      backgroundColor: paleta.bordeSuave,
      marginVertical: 16,
    },
    etiqueta: {
      fontSize: 13,
      color: paleta.verdeGrisaceo,
      marginBottom: 4,
    },
    valor: {
      fontSize: 15,
      fontWeight: "600",
      color: paleta.textoOscuro,
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
      backgroundColor: paleta.verdeBoton,
      justifyContent: "center",
      alignItems: "center",
    },
    textoBotonContador: {
      color: paleta.textoInvertido,
      fontSize: 20,
      fontWeight: "bold",
    },
    valorPersonas: {
      fontSize: 18,
      fontWeight: "bold",
      marginHorizontal: 20,
      color: paleta.textoOscuro,
    },
    filaPrecio: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    etiquetaPrecio: {
      fontSize: 16,
      fontWeight: "600",
      color: paleta.textoOscuro,
    },
    valorPrecio: {
      fontSize: 20,
      fontWeight: "bold",
      color: paleta.verdePrincipal,
    },
    botonConfirmar: {
      backgroundColor: paleta.verdeBoton,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    botonDeshabilitado: {
      opacity: 0.5,
    },
    textoBotonConfirmar: {
      color: paleta.textoInvertido,
      fontSize: 16,
      fontWeight: "bold",
    },
    textoError: {
      fontSize: 16,
      color: paleta.errorTexto,
    },
  });
