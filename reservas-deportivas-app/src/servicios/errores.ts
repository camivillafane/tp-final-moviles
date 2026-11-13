import type { CodigoError } from "@/tipos/api";
export class ErrorServicio extends Error {
    codigo: CodigoError;

    constructor(codigo:CodigoError, mensaje:string){
        super(mensaje);
        this.name="ErrorServicio";
        this.codigo=codigo;
    }
}