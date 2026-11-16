import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { colores } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";

export default function Registro() {
  const router = useRouter();
  const { registrarUsuario } = useSesion();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
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
          placeholderTextColor={colores.verdeGrisaceo}
          value={nombre}
          onChangeText={setNombre}
        />

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
          placeholder="Teléfono"
          placeholderTextColor={colores.verdeGrisaceo}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <TextInput
          style={estilos.input}
          placeholder="Contraseña (mínimo 6 caracteres)"
          placeholderTextColor={colores.verdeGrisaceo}
          value={clave}
          onChangeText={setClave}
          secureTextEntry
        />

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
