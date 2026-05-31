package datos.interno;

import datos.Cliente;
import datos.NodoHibrido;

/**
 * Operaciones de arbol rojo-negro sobre un balde del hash.
 * Solo manipula punteros izquierdo, derecho, padre y esRojo.
 */
public final class ArbolRojoNegro {

    private ArbolRojoNegro() {
    }

    public static NodoHibrido buscar(NodoHibrido raiz, long cuenta) {
        NodoHibrido actual = raiz;
        while (actual != null) {
            if (cuenta == actual.getCuenta()) {
                return actual;
            }
            actual = cuenta < actual.getCuenta() ? actual.getIzquierdo() : actual.getDerecho();
        }
        return null;
    }

    public static NodoHibrido insertar(NodoHibrido raiz, NodoHibrido nuevo) {
        nuevo.setSiguiente(null);

        if (raiz == null) {
            nuevo.setEsRojo(false);
            return nuevo;
        }

        insertarEnArbol(raiz, nuevo);
        corregirInsercion(nuevo);
        return obtenerRaiz(nuevo);
    }

    public static NodoHibrido eliminar(NodoHibrido raiz, NodoHibrido objetivo) {
        if (objetivo.getIzquierdo() != null && objetivo.getDerecho() != null) {
            NodoHibrido sucesor = minimo(objetivo.getDerecho());
            intercambiarDatos(objetivo, sucesor);
            objetivo = sucesor;
        }

        NodoHibrido hijo = objetivo.getIzquierdo() != null ? objetivo.getIzquierdo() : objetivo.getDerecho();
        boolean eraRojo = objetivo.isEsRojo();
        boolean eraRaiz = objetivo.getPadre() == null;

        if (hijo != null) {
            reemplazarNodo(objetivo, hijo);
            if (!eraRojo) {
                corregirEliminacion(hijo);
            }
            return eraRaiz ? obtenerRaiz(hijo) : obtenerRaiz(raiz);
        }

        if (eraRaiz) {
            return null;
        }

        if (!eraRojo) {
            corregirEliminacion(objetivo);
        }
        desengancharNodo(objetivo);
        return obtenerRaiz(raiz);
    }

    public static int contar(NodoHibrido nodo) {
        if (nodo == null) {
            return 0;
        }
        return 1 + contar(nodo.getIzquierdo()) + contar(nodo.getDerecho());
    }

    private static void insertarEnArbol(NodoHibrido raiz, NodoHibrido nuevo) {
        NodoHibrido actual = raiz;
        NodoHibrido padre = null;

        while (actual != null) {
            padre = actual;
            if (nuevo.getCuenta() < actual.getCuenta()) {
                actual = actual.getIzquierdo();
            } else {
                actual = actual.getDerecho();
            }
        }

        nuevo.setPadre(padre);
        if (nuevo.getCuenta() < padre.getCuenta()) {
            padre.setIzquierdo(nuevo);
        } else {
            padre.setDerecho(nuevo);
        }
    }

    private static void corregirInsercion(NodoHibrido nodo) {
        NodoHibrido actual = nodo;

        while (actual.getPadre() != null && actual.getPadre().isEsRojo()) {
            NodoHibrido padre = actual.getPadre();
            NodoHibrido abuelo = padre.getPadre();

            if (abuelo == null) {
                break;
            }

            if (padre == abuelo.getIzquierdo()) {
                NodoHibrido tio = abuelo.getDerecho();
                if (tio != null && tio.isEsRojo()) {
                    padre.setEsRojo(false);
                    tio.setEsRojo(false);
                    abuelo.setEsRojo(true);
                    actual = abuelo;
                } else {
                    if (actual == padre.getDerecho()) {
                        actual = padre;
                        rotarIzquierda(actual);
                        padre = actual.getPadre();
                        abuelo = padre != null ? padre.getPadre() : null;
                    }
                    if (padre != null && abuelo != null) {
                        padre.setEsRojo(false);
                        abuelo.setEsRojo(true);
                        rotarDerecha(abuelo);
                    }
                }
            } else {
                NodoHibrido tio = abuelo.getIzquierdo();
                if (tio != null && tio.isEsRojo()) {
                    padre.setEsRojo(false);
                    tio.setEsRojo(false);
                    abuelo.setEsRojo(true);
                    actual = abuelo;
                } else {
                    if (actual == padre.getIzquierdo()) {
                        actual = padre;
                        rotarDerecha(actual);
                        padre = actual.getPadre();
                        abuelo = padre != null ? padre.getPadre() : null;
                    }
                    if (padre != null && abuelo != null) {
                        padre.setEsRojo(false);
                        abuelo.setEsRojo(true);
                        rotarIzquierda(abuelo);
                    }
                }
            }
        }

        NodoHibrido raiz = obtenerRaiz(nodo);
        if (raiz != null) {
            raiz.setEsRojo(false);
        }
    }

    private static void rotarIzquierda(NodoHibrido nodo) {
        NodoHibrido pivot = nodo.getDerecho();
        nodo.setDerecho(pivot.getIzquierdo());
        if (pivot.getIzquierdo() != null) {
            pivot.getIzquierdo().setPadre(nodo);
        }

        pivot.setPadre(nodo.getPadre());
        if (nodo.getPadre() != null) {
            if (nodo == nodo.getPadre().getIzquierdo()) {
                nodo.getPadre().setIzquierdo(pivot);
            } else {
                nodo.getPadre().setDerecho(pivot);
            }
        }

        pivot.setIzquierdo(nodo);
        nodo.setPadre(pivot);
    }

    private static void rotarDerecha(NodoHibrido nodo) {
        NodoHibrido pivot = nodo.getIzquierdo();
        nodo.setIzquierdo(pivot.getDerecho());
        if (pivot.getDerecho() != null) {
            pivot.getDerecho().setPadre(nodo);
        }

        pivot.setPadre(nodo.getPadre());
        if (nodo.getPadre() != null) {
            if (nodo == nodo.getPadre().getIzquierdo()) {
                nodo.getPadre().setIzquierdo(pivot);
            } else {
                nodo.getPadre().setDerecho(pivot);
            }
        }

        pivot.setDerecho(nodo);
        nodo.setPadre(pivot);
    }

    private static NodoHibrido obtenerRaiz(NodoHibrido nodo) {
        NodoHibrido actual = nodo;
        while (actual.getPadre() != null) {
            actual = actual.getPadre();
        }
        return actual;
    }

    private static void corregirEliminacion(NodoHibrido nodo) {
        NodoHibrido actual = nodo;

        while ((actual == null || !actual.isEsRojo()) && actual != obtenerRaizDesde(actual)) {
            NodoHibrido padre = actual != null ? actual.getPadre() : null;
            if (padre == null) {
                break;
            }

            if (actual == padre.getIzquierdo()) {
                NodoHibrido hermano = padre.getDerecho();
                if (hermano != null && hermano.isEsRojo()) {
                    hermano.setEsRojo(false);
                    padre.setEsRojo(true);
                    rotarIzquierda(padre);
                    hermano = padre.getDerecho();
                }

                if (hermano != null
                        && !esRojoONulo(hermano.getIzquierdo())
                        && !esRojoONulo(hermano.getDerecho())) {
                    hermano.setEsRojo(true);
                    actual = padre;
                } else if (hermano != null) {
                    if (!esRojoONulo(hermano.getDerecho())) {
                        if (hermano.getIzquierdo() != null) {
                            hermano.getIzquierdo().setEsRojo(false);
                        }
                        hermano.setEsRojo(true);
                        rotarDerecha(hermano);
                        hermano = padre.getDerecho();
                    }
                    hermano.setEsRojo(padre.isEsRojo());
                    padre.setEsRojo(false);
                    if (hermano.getDerecho() != null) {
                        hermano.getDerecho().setEsRojo(false);
                    }
                    rotarIzquierda(padre);
                    actual = obtenerRaizDesde(actual);
                }
            } else {
                NodoHibrido hermano = padre.getIzquierdo();
                if (hermano != null && hermano.isEsRojo()) {
                    hermano.setEsRojo(false);
                    padre.setEsRojo(true);
                    rotarDerecha(padre);
                    hermano = padre.getIzquierdo();
                }

                if (hermano != null
                        && !esRojoONulo(hermano.getDerecho())
                        && !esRojoONulo(hermano.getIzquierdo())) {
                    hermano.setEsRojo(true);
                    actual = padre;
                } else if (hermano != null) {
                    if (!esRojoONulo(hermano.getIzquierdo())) {
                        if (hermano.getDerecho() != null) {
                            hermano.getDerecho().setEsRojo(false);
                        }
                        hermano.setEsRojo(true);
                        rotarIzquierda(hermano);
                        hermano = padre.getIzquierdo();
                    }
                    hermano.setEsRojo(padre.isEsRojo());
                    padre.setEsRojo(false);
                    if (hermano.getIzquierdo() != null) {
                        hermano.getIzquierdo().setEsRojo(false);
                    }
                    rotarDerecha(padre);
                    actual = obtenerRaizDesde(actual);
                }
            }
        }

        if (actual != null) {
            actual.setEsRojo(false);
        }
    }

    private static NodoHibrido obtenerRaizDesde(NodoHibrido nodo) {
        if (nodo == null) {
            return null;
        }
        return obtenerRaiz(nodo);
    }

    private static boolean esRojoONulo(NodoHibrido nodo) {
        return nodo == null || nodo.isEsRojo();
    }

    private static NodoHibrido minimo(NodoHibrido nodo) {
        NodoHibrido actual = nodo;
        while (actual.getIzquierdo() != null) {
            actual = actual.getIzquierdo();
        }
        return actual;
    }

    private static void intercambiarDatos(NodoHibrido a, NodoHibrido b) {
        Cliente temporal = a.getDatos();
        a.setDatos(b.getDatos());
        b.setDatos(temporal);
    }

    private static void reemplazarNodo(NodoHibrido objetivo, NodoHibrido reemplazo) {
        if (objetivo.getPadre() == null) {
            reemplazo.setPadre(null);
        } else if (objetivo == objetivo.getPadre().getIzquierdo()) {
            objetivo.getPadre().setIzquierdo(reemplazo);
        } else {
            objetivo.getPadre().setDerecho(reemplazo);
        }
        reemplazo.setPadre(objetivo.getPadre());
        desengancharNodo(objetivo);
    }

    private static void desengancharNodo(NodoHibrido nodo) {
        if (nodo.getPadre() == null) {
            return;
        }
        if (nodo == nodo.getPadre().getIzquierdo()) {
            nodo.getPadre().setIzquierdo(null);
        } else {
            nodo.getPadre().setDerecho(null);
        }
        nodo.setPadre(null);
    }
}
