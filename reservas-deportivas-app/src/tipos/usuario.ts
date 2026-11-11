export type Rol = "jugador" | "encargado";

export interface Usuario {
 id: string;
 nombre: string;
 email: string;
 telefono: string;
 rol: Rol;
 espaciosFavoritos: string[];
 cancelacionesTardias: number;
 ausencias: number;
}
