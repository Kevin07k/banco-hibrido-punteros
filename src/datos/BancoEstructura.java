package datos;

import datos.interno.ArbolRojoNegro;
import datos.interno.ReporteLista;
import datos.interno.TablaHash;

/**
 * Fachada de la capa de datos. Orquesta tabla hash, arboles RBT por balde
 * y generacion del reporte ordenado sin exponer la implementacion interna.
 */
public class BancoEstructura {

    private static final int TAMANO_TABLA_DEFAULT = 101;

    private final TablaHash tabla;
    private NodoHibrido cabezaReporte;
    private boolean reporteGenerado;

    public BancoEstructura() {
        this(TAMANO_TABLA_DEFAULT);
    }

    public BancoEstructura(int tamanoTabla) {
        this.tabla = new TablaHash(tamanoTabla);
        this.cabezaReporte = null;
        this.reporteGenerado = false;
    }

    public int getTamanoTabla() {
        return tabla.getTamano();
    }

    /**
     * Inserta un cliente aplicando hash y balanceo RBT en el balde correspondiente.
     *
     * @return {@code true} si la insercion fue exitosa; {@code false} si la cuenta ya existe.
     */
    public boolean insertar(Cliente cliente) {
        if (cliente == null) {
            throw new IllegalArgumentException("El cliente no puede ser nulo.");
        }

        long cuenta = cliente.getCuenta();
        NodoHibrido raiz = tabla.getRaizPorCuenta(cuenta);

        if (ArbolRojoNegro.buscar(raiz, cuenta) != null) {
            return false;
        }

        NodoHibrido nuevo = new NodoHibrido(cliente);
        tabla.setRaizPorCuenta(cuenta, ArbolRojoNegro.insertar(raiz, nuevo));
        invalidarReporte();
        return true;
    }

    /**
     * Busca un cliente por numero de cuenta.
     */
    public Cliente buscar(long cuenta) {
        NodoHibrido nodo = buscarNodo(cuenta);
        return nodo != null ? nodo.getDatos() : null;
    }

    /**
     * Verifica si una cuenta ya esta registrada (uso de capa de negocio).
     */
    public boolean existeCuenta(long cuenta) {
        return buscarNodo(cuenta) != null;
    }

    /**
     * Elimina un cliente del balde correspondiente y lo desengancha del reporte si aplica.
     */
    public boolean eliminar(long cuenta) {
        NodoHibrido raiz = tabla.getRaizPorCuenta(cuenta);
        NodoHibrido objetivo = ArbolRojoNegro.buscar(raiz, cuenta);

        if (objetivo == null) {
            return false;
        }

        if (reporteGenerado) {
            cabezaReporte = ReporteLista.desenganchar(cabezaReporte, objetivo);
        }

        tabla.setRaizPorCuenta(cuenta, ArbolRojoNegro.eliminar(raiz, objetivo));
        invalidarReporte();
        return true;
    }

    /**
     * Fase 1 + 2 del reporte: encadena todos los nodos y ordena por cuenta con MergeSort.
     *
     * @return cabeza de la lista enlazada ordenada por {@code siguiente}.
     */
    public NodoHibrido generarReporteOrdenado() {
        cabezaReporte = ReporteLista.generarOrdenado(tabla.getCasilleros());
        reporteGenerado = cabezaReporte != null;
        return cabezaReporte;
    }

    /**
     * Entrega la cabeza del reporte ya generado.
     */
    public NodoHibrido obtenerCabezaReporte() {
        return cabezaReporte;
    }

    public int contarClientes() {
        return tabla.contarClientes();
    }

    private NodoHibrido buscarNodo(long cuenta) {
        return ArbolRojoNegro.buscar(tabla.getRaizPorCuenta(cuenta), cuenta);
    }

    private void invalidarReporte() {
        if (reporteGenerado) {
            ReporteLista.limpiarEnlaces(tabla.getCasilleros());
            cabezaReporte = null;
            reporteGenerado = false;
        }
    }
}
