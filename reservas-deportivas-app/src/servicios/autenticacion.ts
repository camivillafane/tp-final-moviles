
import * as Crypto from "expo-crypto";
import type { Usuario } from "@/tipos/usuario";
import { abrirBaseDeDatos } from "@/servicios/dbServicios";

interface DatosRegistro {
    nombre: string;
    email: string;
    telefono: string;
    clave: string;
}

interface DatosLogin {
    email: string;
    clave: string;
}

async function generarHash(clave: string, salt: string): Promise<string> {
    return Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${salt}:${clave}`
    );
}

export async function registrarUsuario(
    datos: DatosRegistro
): Promise<Usuario> {
    const db = await abrirBaseDeDatos();
    const email = datos.email.trim().toLowerCase();

    const existente = await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM usuarios_locales WHERE email = ?;",
        [email]
    );

    if (existente) {
        throw new Error("El correo electrónico ya está registrado.");
    }

    const id = Crypto.randomUUID();
    const salt = Crypto.randomUUID();
    const claveHash = await generarHash(datos.clave, salt);

    const usuario: Usuario = {
        id,
        nombre: datos.nombre.trim(),
        email,
        telefono: datos.telefono.trim(),
        rol: "jugador",
        espaciosFavoritos: [],
        cancelacionesTardias: 0,
        ausencias: 0,
    };

await db.runAsync(
    `INSERT INTO usuarios_locales
    (id, nombre, email, telefono, claveHash, salt, rol,
        espaciosFavoritos, cancelacionesTardias, ausencias)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
        usuario.id,
        usuario.nombre,
        usuario.email,
        usuario.telefono,
        claveHash,
        salt,
        usuario.rol,
        JSON.stringify(usuario.espaciosFavoritos),
        usuario.cancelacionesTardias,
        usuario.ausencias,
        ]
    );

    return usuario;
}

export async function iniciarSesion(
    datos: DatosLogin
): Promise<Usuario> {
    const db = await abrirBaseDeDatos();
    const email = datos.email.trim().toLowerCase();

    const registro = await db.getFirstAsync<{
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    claveHash: string;
    salt: string;
    rol: "jugador" | "encargado";
    espaciosFavoritos: string;
    cancelacionesTardias: number;
    ausencias: number;
}>(
    "SELECT * FROM usuarios_locales WHERE email = ?;",
    [email]
);

    if (!registro) {
        throw new Error("Correo electrónico o contraseña incorrectos.");
    }

const hashIngresado = await generarHash(datos.clave, registro.salt);

    if (hashIngresado !== registro.claveHash) {
        throw new Error("Correo electrónico o contraseña incorrectos.");
    }

    return {
    id: registro.id,
    nombre: registro.nombre,
    email: registro.email,
    telefono: registro.telefono,
    rol: registro.rol,
    espaciosFavoritos: JSON.parse(registro.espaciosFavoritos),
    cancelacionesTardias: registro.cancelacionesTardias,
    ausencias: registro.ausencias,
    };
}
