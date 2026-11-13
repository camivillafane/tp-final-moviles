import { useState } from "react";
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
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { colores } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";

export default function Login() {
  const router = useRouter();
  const { iniciarSesion, iniciarSesionConUsuario } = useSesion();

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);

  const volver = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !clave.trim()) {
      Alert.alert("Atención", "Completá todos los campos.");
      return;
    }

    try {
      setCargando(true);
      await iniciarSesion(email.trim().toLowerCase(), clave);
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleLoginBiometrico = async () => {
    try {
      const activa = await SecureStore.getItemAsync("biometria_activa");
      const usuarioGuardado = await SecureStore.getItemAsync("usuario_biometrico");

      if (activa !== "true" || !usuarioGuardado) {
        Alert.alert(
          "Atención",
          "Primero activá el acceso biométrico desde tu perfil."
        );
        return;
      }

      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Ingresá con tu huella o reconocimiento facial",
      });

      if (resultado.success) {
        const usuario = JSON.parse(usuarioGuardado);
        await iniciarSesionConUsuario(usuario);
        router.replace("/");
      }
    } catch {
      Alert.alert("Error", "No se pudo iniciar sesión con biometría.");
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
        <Text style={estilos.subtitulo}>Iniciar sesión</Text>

        <TextInput
          style={estilos.input}
          placeholder="Correo electrónico"
          placeholderTextColor={colores.verdeGrisaceo}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={estilos.input}
          placeholder="Contraseña"
          placeholderTextColor={colores.verdeGrisaceo}
          value={clave}
          onChangeText={setClave}
          secureTextEntry
        />

        <Pressable
          style={[estilos.boton, cargando && estilos.botonDeshabilitado]}
          onPress={handleLogin}
          disabled={cargando}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBoton}>
            {cargando ? "Ingresando..." : "Ingresar"}
          </Text>
        </Pressable>

        <Pressable
          style={[estilos.boton, estilos.botonSecundario]}
          onPress={handleLoginBiometrico}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBoton}>Ingresar con huella</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/registro")}>
          <Text style={estilos.enlace}>¿No tenés cuenta? Registrate</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: colores.fondo,
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
    paddingBottom: 40,
  },
  titulo: {
    color: colores.textoOscuro,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitulo: {
    color: colores.verdePrincipal,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 28,
    textAlign: "center",
  },
  input: {
    backgroundColor: colores.blanco,
    borderColor: colores.borde,
    borderRadius: 12,
    borderWidth: 1,
    color: colores.textoOscuro,
    fontSize: 15,
    marginBottom: 14,
    padding: 14,
  },
  boton: {
    alignItems: "center",
    backgroundColor: colores.verdePrincipal,
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
  },
  botonSecundario: {
    backgroundColor: colores.verdeSecundario,
    marginTop: 12,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "700",
  },
  enlace: {
    color: colores.verdePrincipal,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 22,
    textAlign: "center",
  },
});
