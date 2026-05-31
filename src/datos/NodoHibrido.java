package datos;

/**
 * Celda de memoria hibrida con triple canal de punteros.
 * <ul>
 *   <li>Canal arbol RBT: izquierdo, derecho, padre, esRojo</li>
 *   <li>Canal reporte: siguiente (lista enlazada independiente del arbol)</li>
 * </ul>
 */
public class NodoHibrido {

    private Cliente datos;
    private NodoHibrido izquierdo;
    private NodoHibrido derecho;
    private NodoHibrido padre;
    private NodoHibrido siguiente;
    private boolean esRojo;

    public NodoHibrido(Cliente datos) {
        this.datos = datos;
        this.izquierdo = null;
        this.derecho = null;
        this.padre = null;
        this.siguiente = null;
        this.esRojo = true;
    }

    public Cliente getDatos() {
        return datos;
    }

    public void setDatos(Cliente datos) {
        this.datos = datos;
    }

    public NodoHibrido getIzquierdo() {
        return izquierdo;
    }

    public void setIzquierdo(NodoHibrido izquierdo) {
        this.izquierdo = izquierdo;
    }

    public NodoHibrido getDerecho() {
        return derecho;
    }

    public void setDerecho(NodoHibrido derecho) {
        this.derecho = derecho;
    }

    public NodoHibrido getPadre() {
        return padre;
    }

    public void setPadre(NodoHibrido padre) {
        this.padre = padre;
    }

    public NodoHibrido getSiguiente() {
        return siguiente;
    }

    public void setSiguiente(NodoHibrido siguiente) {
        this.siguiente = siguiente;
    }

    public boolean isEsRojo() {
        return esRojo;
    }

    public void setEsRojo(boolean esRojo) {
        this.esRojo = esRojo;
    }

    public long getCuenta() {
        return datos.getCuenta();
    }
}
