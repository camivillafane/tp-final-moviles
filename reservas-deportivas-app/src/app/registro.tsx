
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
import { registrarUsuario } from "@/servicios/autenticacion";
import { useSesion } from "@/contextos/Sesion";

export default function Registro() {
    const router = useRouter();
    const { iniciarSesion } = useSesion();

    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [clave, setClave] = useState("");
    const [cargando, setCargando] = useState(false);

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

        await iniciarSesion(email.trim().toLowerCase(), clave);
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
        <View style={styles.container}>
        <Text style={styles.titulo}>Reservas Deportivas</Text>
        <Text style={styles.subtitulo}>Crear cuenta</Text>

        <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
        />

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
            placeholder="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
        />

        <TextInput
            style={styles.input}
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={clave}
            onChangeText={setClave}
            secureTextEntry
        />

        <Pressable
            style={styles.boton}
            onPress={handleRegistro}
            disabled={cargando}
        >
            <Text style={styles.textoBoton}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
            </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/login" as any)}>
            <Text style={styles.enlace}>¿Ya tenés cuenta? Iniciá sesión</Text>
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
enlace: {
    textAlign: "center",
    marginTop: 22,
    color: "#3157a4",
    fontWeight: "600",
},
});
