import type { Usuario } from "./usuario";

export interface Meta {
    total: number;
    pagina: number;
    porPagina: number;
}

export interface RespuestaLista<T> {
    datos: T[];
    meta: Meta;
}

export interface RespuestaUno <T> {
    datos: T;
    meta: Meta;
}

export interface RespuestaError {
    error: {
        codigo: string;
        mensaje: string;
    }
}

export type CodigoError =
    | "VALIDACION_FALLIDA"
    | "CREDENCIALES_INVALIDAS"
    | "NO_AUTENTICADO"
    | "SIN_PERMISO"
    | "ARCHIVO_NO_ENCONTRADO"
    | "BLOQUEO_NO_ENCONTRADO"
    | "CODIGO_INVALIDO"
    | "ESPACIO_NO_ENCONTRADO"
    | "FIJA_NO_ENCONTRADA"
    | "RESERVA_NO_ENCONTRADA"
    | "RUTA_NO_ENCONTRADA"
    | "TURNO_NO_ENCONTRADO"
    | "USUARIO_NO_ENCONTRADO"
    | "CONFLICTO_CON_RESERVAS"
    | "EMAIL_YA_REGISTRADO"
    | "FIJA_SUPERPUESTA"
    | "INGRESO_YA_REGISTRADO"
    | "RESERVA_NO_CANCELABLE"
    | "TURNO_NO_DISPONIBLE"
    | "TURNO_OCUPADO"
    | "ARCHIVO_DEMASIADO_GRANDE"
    | "TIPO_DE_ARCHIVO_NO_PERMITIDO"
    | "RANGO_NO_VALIDO"
    | "ANTES_DE_TIEMPO"
    | "CANCELACION_FUERA_DE_PLAZO"
    | "CAPACIDAD_EXCEDIDA"
    | "CODIGO_DE_OTRO_DIA"
    | "CODIGO_DE_OTRO_ESPACIO"
    | "FECHA_FUERA_DE_RANGO"
    | "FECHA_PASADA"
    | "FUERA_DE_HORARIO"
    | "LIMITE_DE_RESERVAS"
    | "MOTIVO_REQUERIDO"
    | "RESERVA_AUSENTE"
    | "RESERVA_CANCELADA"
    | "TURNO_PASADO"
    | "ERROR_INTERNO"
    | "NO_IMPLEMENTADO"
    | "ALMACEN_NO_DISPONIBLE"
    | "ERROR_RED";

export interface Bloqueo {
    id: string;
    espacioId: string;
    fecha: string;
    inicio: string | null;
    fin: string | null;
    motivo: string;
}

export interface ReservaFijaApi {
    id: string;
    espacioId: string;
    titular: string;
    dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    inicio: string;
    fin: string;
    desde: string;
    hasta: string | null;
    activa: boolean;
}

export interface Sesion {
    token: string;
    usuario: Usuario;
}

export interface ArchivoSubido {
    url: string;
    tipo: "imagen" | "audio" | "video";
    bytes: number;
}

export interface Salud {
    estado: "ok";
    motor: "better-sqlite3" | "postgres" | "mysql" | "mariadb";
    almacen: "local" | "aws" | "supabase" | "r2" | "b2" | "s3proxy" | "localstack";
    version: string;
}

export interface Dispositivo {
    tokenExpo: string;
    plataforma: "ios" | "android";
}

export interface PruebaDePush {
    dispositivos: number;
}
