
import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSesion } from "@/contextos/Sesion";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export default function Login() {
    const router = useRouter();
    const { iniciarSesion, iniciarSesionConUsuario } = useSesion();

    const [email, setEmail] = useState("");
    const [clave, setClave] = useState("");
    const [cargando, setCargando] = useState(false);

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
            error instanceof Error
                ? error.message
                : "No se pudo iniciar sesión."
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
        <View style={styles.container}>
        <Text style={styles.titulo}>Reservas Deportivas</Text>
        <Text style={styles.subtitulo}>Iniciar sesión</Text>

        <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
        />

        <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={clave}
            onChangeText={setClave}
            secureTextEntry
        />

        <Pressable
            style={styles.boton}
            onPress={handleLogin}
            disabled={cargando}
        >
            <Text style={styles.textoBoton}>
            {cargando ? "Ingresando..." : "Ingresar"}
            </Text>
        </Pressable>

        <Pressable
            style={[styles.boton, { marginTop: 12, backgroundColor: "#43856b" }]}
            onPress={handleLoginBiometrico}>
            <Text style={styles.textoBoton}>
                Ingresar con huella
            </Text>
        </Pressable>


        <Pressable onPress={() => router.push("/registro" as any)}>
            <Text style={styles.registro}>¿No tenés cuenta? Registrate</Text>
        </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 25,
        backgroundColor: "#e9e9eb",
    },
    titulo: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },
    subtitulo: {
        fontSize: 20,
        textAlign: "center",
        marginBottom: 30,
    },
    input: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    boton: {
        backgroundColor: "#3157a4",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
    },
    textoBoton: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    registro: {
        textAlign: "center",
        marginTop: 22,
        color: "#3157a4",
        fontWeight: "600",
    },
});
