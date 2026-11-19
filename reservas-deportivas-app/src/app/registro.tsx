import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";

export default function Registro() {
  const router = useRouter();
  const { registrarUsuario } = useSesion();
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);

  const volver = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleRegistro = async () => {
    if (!nombre.trim() || !email.trim() || !telefono.trim() || !clave.trim()) {
      Alert.alert("Atención", "Completá todos los campos.");
      return;
    }

    if (clave.length < 6) {
      Alert.alert("Atención", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setCargando(true);

      await registrarUsuario({
        nombre,
        email,
        telefono,
        clave,
      });

      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo crear la cuenta."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <HeaderInstitucional mostrarVolver onVolverPress={volver} />

      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.titulo}>Reservas Deportivas</Text>
        <Text style={estilos.subtitulo}>Crear cuenta</Text>

        <TextInput
          style={estilos.input}
          placeholder="Nombre completo"
          placeholderTextColor={paleta.verdeGrisaceo}
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={estilos.input}
          placeholder="Correo electrónico"
          placeholderTextColor={paleta.verdeGrisaceo}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={estilos.input}
          placeholder="Teléfono"
          placeholderTextColor={paleta.verdeGrisaceo}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <View style={estilos.contenedorClave}>
          <TextInput
            style={estilos.inputClave}
            placeholder="Contraseña (mínimo 6 caracteres)"
            placeholderTextColor={paleta.verdeGrisaceo}
            value={clave}
            onChangeText={setClave}
            secureTextEntry={!mostrarClave}
          />
          <Pressable
            style={estilos.botonVerClave}
            onPress={() => setMostrarClave((previo) => !previo)}
            accessibilityRole="button"
            accessibilityLabel={
              mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            <IonIcons
              name={mostrarClave ? "eye-off" : "eye"}
              size={22}
              color={paleta.verdeGrisaceo}
            />
          </Pressable>
        </View>

        <Pressable
          style={[estilos.boton, cargando && estilos.botonDeshabilitado]}
          onPress={handleRegistro}
          disabled={cargando}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBoton}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/login")}>
          <Text style={estilos.enlace}>¿Ya tenés cuenta? Iniciá sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      backgroundColor: paleta.fondo,
      flex: 1,
    },
    contenido: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 25,
      paddingBottom: 40,
    },
    titulo: {
      color: paleta.textoOscuro,
      fontSize: 26,
      fontWeight: "700",
      marginBottom: 6,
      textAlign: "center",
    },
    subtitulo: {
      color: paleta.verdePrincipal,
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 28,
      textAlign: "center",
    },
    input: {
      backgroundColor: paleta.superficie,
      borderColor: paleta.borde,
      borderRadius: 12,
      borderWidth: 1,
      color: paleta.textoOscuro,
      fontSize: 15,
      marginBottom: 14,
      padding: 14,
    },
    contenedorClave: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: paleta.superficie,
      borderColor: paleta.borde,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 14,
    },
    inputClave: {
      color: paleta.textoOscuro,
      flex: 1,
      fontSize: 15,
      padding: 14,
    },
    botonVerClave: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    boton: {
      alignItems: "center",
      backgroundColor: paleta.verdeBoton,
      borderRadius: 12,
      marginTop: 8,
      padding: 16,
    },
    botonDeshabilitado: {
      opacity: 0.6,
    },
    textoBoton: {
      color: paleta.textoInvertido,
      fontSize: 16,
      fontWeight: "700",
    },
    enlace: {
      color: paleta.verdePrincipal,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 22,
      textAlign: "center",
    },
  });
