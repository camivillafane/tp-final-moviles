
import type { Sesion } from "@/tipos/api";
import { post } from "@/servicios/cliente";

export interface DatosRegistro {
    nombre: string;
    email: string;
    telefono: string;
    clave: string;
}

export interface DatosLogin {
    email: string;
    clave: string;
}

export async function registrarUsuario(
    datos: DatosRegistro
): Promise<Sesion> {
    return post<Sesion>("/auth/registro", {
        nombre: datos.nombre.trim(),
        email: datos.email.trim().toLowerCase(),
        telefono: datos.telefono.trim(),
        contrasena: datos.clave,
    });
}

export async function iniciarSesion(
    datos: DatosLogin
): Promise<Sesion> {
    return post<Sesion>("/auth/ingreso", {
        email: datos.email.trim().toLowerCase(),
        contrasena: datos.clave,
    });
}