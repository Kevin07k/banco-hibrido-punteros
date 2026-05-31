package datos.interno;

import datos.Cliente;
import datos.NodoHibrido;

/**
 * Construccion y ordenamiento del reporte usando unicamente el puntero {@code siguiente}.
 * No utiliza colecciones de {@code java.util}.
 */
public final class ReporteLista {

    private ReporteLista() {
    }

    public static NodoHibrido generarOrdenado(NodoHibrido[] casilleros) {
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

        return mergeSortLista(cabeza);
    }

    public static void limpiarEnlaces(NodoHibrido[] casilleros) {
        for (NodoHibrido raiz : casilleros) {
            limpiarSiguienteEnArbol(raiz);
        }
    }

    public static NodoHibrido desenganchar(NodoHibrido cabezaReporte, NodoHibrido nodo) {
        if (cabezaReporte == null || nodo == null) {
            return cabezaReporte;
        }

        if (cabezaReporte == nodo) {
            NodoHibrido nuevaCabeza = nodo.getSiguiente();
            nodo.setSiguiente(null);
            return nuevaCabeza;
        }

        NodoHibrido anterior = cabezaReporte;
        while (anterior.getSiguiente() != null && anterior.getSiguiente() != nodo) {
            anterior = anterior.getSiguiente();
        }

        if (anterior.getSiguiente() == nodo) {
            anterior.setSiguiente(nodo.getSiguiente());
            nodo.setSiguiente(null);
        }

        return cabezaReporte;
    }

    private static void recorridoInordenEncadenar(NodoHibrido nodo, Encadenador encadenador) {
        if (nodo == null) {
            return;
        }
        recorridoInordenEncadenar(nodo.getIzquierdo(), encadenador);
        encadenador.agregar(nodo);
        recorridoInordenEncadenar(nodo.getDerecho(), encadenador);
    }

    private static NodoHibrido mergeSortLista(NodoHibrido cabeza) {
        if (cabeza == null || cabeza.getSiguiente() == null) {
            return cabeza;
        }

        NodoHibrido segundaMitad = dividirLista(cabeza);
        NodoHibrido izquierda = mergeSortLista(cabeza);
        NodoHibrido derecha = mergeSortLista(segundaMitad);
        return fusionarListas(izquierda, derecha);
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

    private static void limpiarSiguienteEnArbol(NodoHibrido nodo) {
        if (nodo == null) {
            return;
        }
        limpiarSiguienteEnArbol(nodo.getIzquierdo());
        nodo.setSiguiente(null);
        limpiarSiguienteEnArbol(nodo.getDerecho());
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
                cabeza = nodo;
                cola = nodo;
                return;
            }
            cola.setSiguiente(nodo);
            cola = nodo;
        }
    }
}
