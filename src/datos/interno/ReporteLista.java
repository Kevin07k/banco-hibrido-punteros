package datos.interno;

import datos.Cliente;
import datos.NodoHibrido;

/**
 * Construccion y ordenamiento del reporte con lista doblemente enlazada
 * ({@code siguiente} + {@code anterior}). No utiliza colecciones de {@code java.util}.
 */
public final class ReporteLista {

    private ReporteLista() {
    }

    /**
     * Cabeza y cola de la lista reporte tras una operacion de enlace.
     */
    public static final class ExtremosLista {
        public final NodoHibrido cabeza;
        public final NodoHibrido cola;

        public ExtremosLista(NodoHibrido cabeza, NodoHibrido cola) {
            this.cabeza = cabeza;
            this.cola = cola;
        }
    }

    /**
     * Pipeline completo: inorden por balde + merge (uso legacy o banco sin lista previa).
     */
    public static NodoHibrido generarOrdenado(NodoHibrido[] casilleros) {
        ExtremosLista extremos = armarDesdeBosque(casilleros);
        NodoHibrido ordenada = mergeSortLista(extremos.cabeza);
        return ordenada;
    }

    /**
     * Recorre el bosque en inorden y arma la lista reporte con doble enlace.
     */
    public static ExtremosLista armarDesdeBosque(NodoHibrido[] casilleros) {
        limpiarEnlaces(casilleros);

        NodoHibrido cabeza = null;
        NodoHibrido cola = null;

        for (NodoHibrido raiz : casilleros) {
            if (raiz != null) {
                Encadenador encadenador = new Encadenador(cabeza, cola);
                recorridoInordenEncadenar(raiz, encadenador);
                cabeza = encadenador.cabeza;
                cola = encadenador.cola;
            }
        }

        return new ExtremosLista(cabeza, cola);
    }

    /**
     * Append en O(1) al final de la lista reporte.
     */
    public static ExtremosLista encadenarAlFinal(NodoHibrido cabeza, NodoHibrido cola, NodoHibrido nodo) {
        nodo.setSiguiente(null);
        if (cabeza == null) {
            nodo.setAnterior(null);
            return new ExtremosLista(nodo, nodo);
        }
        nodo.setAnterior(cola);
        cola.setSiguiente(nodo);
        return new ExtremosLista(cabeza, nodo);
    }

    /**
     * Desengancha un nodo de la lista reporte en O(1) usando {@code anterior} y {@code siguiente}.
     */
    public static ExtremosLista desenganchar(NodoHibrido cabeza, NodoHibrido cola, NodoHibrido nodo) {
        if (cabeza == null || nodo == null) {
            return new ExtremosLista(cabeza, cola);
        }

        NodoHibrido ant = nodo.getAnterior();
        NodoHibrido sig = nodo.getSiguiente();

        if (ant != null) {
            ant.setSiguiente(sig);
        } else {
            cabeza = sig;
        }

        if (sig != null) {
            sig.setAnterior(ant);
        } else {
            cola = ant;
        }

        nodo.setSiguiente(null);
        nodo.setAnterior(null);

        return new ExtremosLista(cabeza, cola);
    }

    public static NodoHibrido mergeSortLista(NodoHibrido cabeza) {
        if (cabeza == null || cabeza.getSiguiente() == null) {
            if (cabeza != null) {
                cabeza.setAnterior(null);
            }
            return cabeza;
        }

        NodoHibrido segundaMitad = dividirLista(cabeza);
        NodoHibrido izquierda = mergeSortLista(cabeza);
        NodoHibrido derecha = mergeSortLista(segundaMitad);
        NodoHibrido ordenada = fusionarListas(izquierda, derecha);
        reconstruirAnteriores(ordenada);
        return ordenada;
    }

    public static NodoHibrido obtenerCola(NodoHibrido cabeza) {
        if (cabeza == null) {
            return null;
        }
        NodoHibrido actual = cabeza;
        while (actual.getSiguiente() != null) {
            actual = actual.getSiguiente();
        }
        return actual;
    }

    public static void limpiarEnlaces(NodoHibrido[] casilleros) {
        for (NodoHibrido raiz : casilleros) {
            limpiarEnlacesEnArbol(raiz);
        }
    }

    private static void recorridoInordenEncadenar(NodoHibrido nodo, Encadenador encadenador) {
        if (nodo == null) {
            return;
        }
        recorridoInordenEncadenar(nodo.getIzquierdo(), encadenador);
        encadenador.agregar(nodo);
        recorridoInordenEncadenar(nodo.getDerecho(), encadenador);
    }

    private static NodoHibrido dividirLista(NodoHibrido cabeza) {
        NodoHibrido lento = cabeza;
        NodoHibrido rapido = cabeza.getSiguiente();

        while (rapido != null && rapido.getSiguiente() != null) {
            lento = lento.getSiguiente();
            rapido = rapido.getSiguiente().getSiguiente();
        }

        NodoHibrido segundaMitad = lento.getSiguiente();
        lento.setSiguiente(null);
        if (segundaMitad != null) {
            segundaMitad.setAnterior(null);
        }
        return segundaMitad;
    }

    private static NodoHibrido fusionarListas(NodoHibrido a, NodoHibrido b) {
        NodoHibrido dummy = new NodoHibrido(new Cliente(0, "", "", 0));
        NodoHibrido actual = dummy;

        while (a != null && b != null) {
            if (a.getCuenta() <= b.getCuenta()) {
                actual.setSiguiente(a);
                a = a.getSiguiente();
            } else {
                actual.setSiguiente(b);
                b = b.getSiguiente();
            }
            actual = actual.getSiguiente();
        }

        actual.setSiguiente(a != null ? a : b);
        return dummy.getSiguiente();
    }

    private static void reconstruirAnteriores(NodoHibrido cabeza) {
        NodoHibrido prev = null;
        NodoHibrido actual = cabeza;
        while (actual != null) {
            actual.setAnterior(prev);
            prev = actual;
            actual = actual.getSiguiente();
        }
    }

    private static void limpiarEnlacesEnArbol(NodoHibrido nodo) {
        if (nodo == null) {
            return;
        }
        limpiarEnlacesEnArbol(nodo.getIzquierdo());
        nodo.setSiguiente(null);
        nodo.setAnterior(null);
        limpiarEnlacesEnArbol(nodo.getDerecho());
    }

    private static final class Encadenador {
        private NodoHibrido cabeza;
        private NodoHibrido cola;

        private Encadenador(NodoHibrido cabeza, NodoHibrido cola) {
            this.cabeza = cabeza;
            this.cola = cola;
        }

        private void agregar(NodoHibrido nodo) {
            nodo.setSiguiente(null);
            if (cabeza == null) {
                nodo.setAnterior(null);
                cabeza = nodo;
                cola = nodo;
                return;
            }
            nodo.setAnterior(cola);
            cola.setSiguiente(nodo);
            cola = nodo;
        }
    }
}
