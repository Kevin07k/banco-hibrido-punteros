package datos.interno;

import datos.NodoHibrido;

/**
 * Arreglo estatico de la tabla hash. Cada casillero apunta a la raiz RBT de un balde.
 */
public final class TablaHash {

    private final NodoHibrido[] casilleros;

    public TablaHash(int tamano) {
        if (tamano <= 0) {
            throw new IllegalArgumentException("El tamano de la tabla hash debe ser mayor a cero.");
        }
        this.casilleros = new NodoHibrido[tamano];
    }

    public int getTamano() {
        return casilleros.length;
    }

    public NodoHibrido[] getCasilleros() {
        return casilleros;
    }

    public int calcularIndice(long cuenta) {
        return Math.floorMod(cuenta, casilleros.length);
    }

    public NodoHibrido getRaiz(int indice) {
        return casilleros[indice];
    }

    public void setRaiz(int indice, NodoHibrido raiz) {
        casilleros[indice] = raiz;
    }

    public NodoHibrido getRaizPorCuenta(long cuenta) {
        return casilleros[calcularIndice(cuenta)];
    }

    public void setRaizPorCuenta(long cuenta, NodoHibrido raiz) {
        casilleros[calcularIndice(cuenta)] = raiz;
    }

    public int contarClientes() {
        int total = 0;
        for (NodoHibrido raiz : casilleros) {
            total += ArbolRojoNegro.contar(raiz);
        }
        return total;
    }
}
