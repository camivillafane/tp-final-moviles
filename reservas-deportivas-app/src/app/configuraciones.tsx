import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";

import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { useTema } from "@/contextos/Tema";
import { useSesion } from "@/contextos/Sesion";
import {
  activarAccesoBiometrico,
  desactivarAccesoBiometrico,
  estaBiometriaActiva,
} from "@/servicios/biometria";
import type { Paleta } from "@/constantes/colores";

type NombreIcono = ComponentProps<typeof IonIcons>["name"];

export default function Configuraciones() {
  const router = useRouter();
  const { usuario } = useSesion();
  const { modo, paleta, cambiarModo } = useTema();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  const [biometriaActiva, setBiometriaActiva] = useState(false);
  const [cambiandoBiometria, setCambiandoBiometria] = useState(false);

  useEffect(() => {
    if (!usuario) {
      setBiometriaActiva(false);
      return;
    }

    estaBiometriaActiva()
      .then(setBiometriaActiva)
      .catch((error) => {
        console.error("No se pudo leer el estado de la biometría:", error);
      });
  }, [usuario]);

  const alternarBiometria = async (activar: boolean) => {
    if (!usuario || cambiandoBiometria) return;

    setCambiandoBiometria(true);

    try {
      if (activar) {
        const activada = await activarAccesoBiometrico(usuario);

        if (activada) {
          setBiometriaActiva(true);
          Alert.alert("¡Listo!", "Acceso biométrico activado.");
        }
      } else {
        await desactivarAccesoBiometrico();
        setBiometriaActiva(false);
        Alert.alert(
          "Acceso biométrico desactivado",
          "Ya no vas a poder ingresar con huella o reconocimiento facial."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el acceso biométrico."
      );
    } finally {
      setCambiandoBiometria(false);
    }
  };

  const alternarTema = () => {
    void cambiarModo(modo === "claro" ? "oscuro" : "claro");
  };

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.titulo}>Configuraciones</Text>

        {usuario && (
          <>
            <Text style={estilos.tituloSeccion}>Seguridad</Text>
            <View style={estilos.tarjeta}>
              <FilaConfiguracion
                icono="finger-print-outline"
                titulo="Acceso biométrico"
                descripcion="Ingresá con huella o reconocimiento facial."
                paleta={paleta}
                control={
                  <Switch
                    value={biometriaActiva}
                    onValueChange={alternarBiometria}
                    disabled={cambiandoBiometria}
                    trackColor={{
                      false: paleta.borde,
                      true: paleta.verdeBoton,
                    }}
                    thumbColor={paleta.textoInvertido}
                    ios_backgroundColor={paleta.borde}
                  />
                }
              />
            </View>
          </>
        )}

        <Text style={estilos.tituloSeccion}>Apariencia</Text>
        <View style={estilos.tarjeta}>
          <FilaConfiguracion
            icono={modo === "oscuro" ? "moon-outline" : "sunny-outline"}
            titulo="Modo oscuro"
            descripcion={
              modo === "oscuro"
                ? "Tema oscuro activado para usar de noche."
                : "Tema claro activado. Podés cambiarlo cuando quieras."
            }
            paleta={paleta}
            control={
              <Switch
                value={modo === "oscuro"}
                onValueChange={alternarTema}
                trackColor={{
                  false: paleta.borde,
                  true: paleta.verdeBoton,
                }}
                thumbColor={paleta.textoInvertido}
                ios_backgroundColor={paleta.borde}
              />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FilaConfiguracionProps {
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
  control: ReactNode;
  paleta: Paleta;
}

function FilaConfiguracion({
  icono,
  titulo,
  descripcion,
  control,
  paleta,
}: FilaConfiguracionProps) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
      <View
        style={{
          alignItems: "center",
          backgroundColor: paleta.superficieAlt,
          borderRadius: 12,
          height: 40,
          justifyContent: "center",
          width: 40,
        }}
      >
        <IonIcons name={icono} size={22} color={paleta.verdePrincipal} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: paleta.textoOscuro,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {titulo}
        </Text>
        <Text
          style={{
            color: paleta.verdeGrisaceo,
            fontSize: 13,
            lineHeight: 18,
            marginTop: 2,
          }}
        >
          {descripcion}
        </Text>
      </View>

      {control}
    </View>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      backgroundColor: paleta.fondo,
      flex: 1,
    },
    contenido: {
      padding: 20,
      paddingBottom: 40,
    },
    titulo: {
      color: paleta.textoOscuro,
      fontSize: 26,
      fontWeight: "700",
      marginBottom: 8,
    },
    tituloSeccion: {
      color: paleta.verdePrincipal,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.6,
      marginBottom: 8,
      marginTop: 22,
      textTransform: "uppercase",
    },
    tarjeta: {
      backgroundColor: paleta.superficie,
      borderColor: paleta.bordeSuave,
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
    },
    nota: {
      color: paleta.verdeGrisaceo,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 18,
      textAlign: "center",
    },
  });
