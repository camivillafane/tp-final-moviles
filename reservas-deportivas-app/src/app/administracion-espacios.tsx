import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { colores } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";
import {
  cambiarPrecioEspacio,
  listarEspaciosAdministracion,
} from "@/servicios/administracionEspacios";
import type { Espacio } from "@/tipos/espacio";

const formatoPesos = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);

export default function AdministracionEspaciosPantalla() {
  const router = useRouter();
  const { usuario, cargando: cargandoSesion } = useSesion();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [preciosEditados, setPreciosEditados] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarEspacios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await listarEspaciosAdministracion();
      setEspacios(resultado.filter((espacio) => espacio.activo));
      setPreciosEditados({});
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudieron cargar los espacios. Intentá nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!cargandoSesion && usuario?.rol === "administrador") {
        void cargarEspacios();
      }
    }, [cargandoSesion, usuario, cargarEspacios])
  );

  const guardarPrecio = async (espacio: Espacio) => {
    const textoPrecio = preciosEditados[espacio.id] ?? String(espacio.precioPorHora);
    const precio = Number(textoPrecio);

    if (!Number.isInteger(precio) || precio <= 0 || precio > 100_000_000) {
      Alert.alert("Precio inválido", "Ingresá un precio entero mayor que cero.");
      return;
    }

    setGuardandoId(espacio.id);
    try {
      const actualizado = await cambiarPrecioEspacio(espacio.id, precio);
      setEspacios((actuales) =>
        actuales.map((item) => (item.id === actualizado.id ? actualizado : item))
      );
      setPreciosEditados((actuales) => {
        const siguientes = { ...actuales };
        delete siguientes[espacio.id];
        return siguientes;
      });
      Alert.alert("Precio actualizado", `${actualizado.nombre}: ${formatoPesos(actualizado.precioPorHora)} por hora.`);
    } catch (fallo) {
      Alert.alert(
        "No se pudo guardar",
        fallo instanceof Error ? fallo.message : "Intentá nuevamente."
      );
    } finally {
      setGuardandoId(null);
    }
  };

  if (cargandoSesion) {
    return <VistaMensaje mensaje="Verificando la sesión..." />;
  }

  if (!usuario || usuario.rol !== "administrador") {
    return (
      <VistaMensaje
        mensaje="Solo una cuenta administradora puede gestionar los precios."
        volver={() => router.replace("/")}
      />
    );
  }

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <IonIcons name="arrow-back" size={24} color={colores.verdePrincipal} />
        </Pressable>
        <Text style={estilos.titulo}>Gestión de espacios</Text>
        <Pressable
          onPress={cargarEspacios}
          accessibilityRole="button"
          accessibilityLabel="Actualizar espacios"
        >
          <IonIcons name="refresh-outline" size={23} color={colores.verdePrincipal} />
        </Pressable>
      </View>

      <Text style={estilos.descripcion}>
        Actualizá el precio por hora de los espacios municipales.
      </Text>

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator color={colores.verdePrincipal} size="large" />
          <Text style={estilos.textoSecundario}>Cargando espacios...</Text>
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.error}>{error}</Text>
          <Pressable style={estilos.botonReintentar} onPress={cargarEspacios}>
            <Text style={estilos.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      ) : espacios.length === 0 ? (
        <View style={estilos.centro}>
          <Text style={estilos.textoSecundario}>No hay espacios activos.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={estilos.lista}
          keyboardShouldPersistTaps="handled"
        >
          {espacios.map((espacio) => {
            const precio = preciosEditados[espacio.id] ?? String(espacio.precioPorHora);
            const guardando = guardandoId === espacio.id;
            return (
              <View key={espacio.id} style={estilos.tarjeta}>
                <Text style={estilos.nombre}>{espacio.nombre}</Text>
                <Text style={estilos.complejo}>{espacio.complejo}</Text>
                <Text style={estilos.dato}>Superficie: {espacio.superficie}</Text>

                <Text style={estilos.etiquetaPrecio}>Precio por hora</Text>
                <View style={estilos.filaPrecio}>
                  <Text style={estilos.simboloPesos}>$</Text>
                  <TextInput
                    value={precio}
                    onChangeText={(valor) =>
                      setPreciosEditados((actuales) => ({
                        ...actuales,
                        [espacio.id]: valor.replace(/\D/g, ""),
                      }))
                    }
                    editable={!guardando}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={9}
                    accessibilityLabel={`Precio por hora de ${espacio.nombre}`}
                    style={estilos.entradaPrecio}
                  />
                  <Pressable
                    style={[estilos.botonGuardar, guardando && estilos.botonDeshabilitado]}
                    onPress={() => void guardarPrecio(espacio)}
                    disabled={guardando}
                    accessibilityRole="button"
                  >
                    {guardando ? (
                      <ActivityIndicator color={colores.blanco} />
                    ) : (
                      <Text style={estilos.textoBoton}>Guardar</Text>
                    )}
                  </Pressable>
                </View>
                <Text style={estilos.precioActual}>
                  Actual: {formatoPesos(espacio.precioPorHora)} por hora
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function VistaMensaje({ mensaje, volver }: { mensaje: string; volver?: () => void }) {
  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <View style={estilos.centro}>
        <Text style={estilos.textoSecundario}>{mensaje}</Text>
        {volver && (
          <Pressable style={estilos.botonReintentar} onPress={volver}>
            <Text style={estilos.textoBoton}>Volver</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { backgroundColor: colores.fondo, flex: 1 },
  encabezado: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  titulo: { color: colores.textoOscuro, fontSize: 20, fontWeight: "700" },
  descripcion: { color: colores.verdeGrisaceo, fontSize: 14, paddingHorizontal: 18, paddingBottom: 10 },
  lista: { padding: 16, paddingBottom: 32 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 14, marginBottom: 14, padding: 16 },
  nombre: { color: colores.textoOscuro, fontSize: 17, fontWeight: "700" },
  complejo: { color: colores.verdeGrisaceo, fontSize: 13, marginTop: 3 },
  dato: { color: colores.textoOscuro, fontSize: 13, marginTop: 10 },
  etiquetaPrecio: { color: colores.textoOscuro, fontSize: 14, fontWeight: "600", marginTop: 16 },
  filaPrecio: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 7 },
  simboloPesos: { color: colores.textoOscuro, fontSize: 18, fontWeight: "700" },
  entradaPrecio: {
    backgroundColor: colores.fondo,
    borderColor: colores.borde,
    borderRadius: 8,
    borderWidth: 1,
    color: colores.textoOscuro,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  botonGuardar: { alignItems: "center", backgroundColor: colores.verdePrincipal, borderRadius: 8, minWidth: 88, paddingHorizontal: 14, paddingVertical: 11 },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: colores.blanco, fontSize: 14, fontWeight: "700" },
  precioActual: { color: colores.verdeGrisaceo, fontSize: 12, marginTop: 7 },
  centro: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  textoSecundario: { color: colores.verdeGrisaceo, fontSize: 15, textAlign: "center" },
  error: { color: "#9b2c2c", fontSize: 15, textAlign: "center" },
  botonReintentar: { backgroundColor: colores.verdePrincipal, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11 },
});
