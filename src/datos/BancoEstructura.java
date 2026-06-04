package datos;

import datos.interno.ArbolRojoNegro;
import datos.interno.ReporteLista;
import datos.interno.ReporteLista.ExtremosLista;
import datos.interno.TablaHash;

/**
 * Fachada de la capa de datos. Orquesta tabla hash, arboles RBT por balde
 * y generacion del reporte ordenado sin exponer la implementacion interna.
 *
 * <p>Lista reporte doblemente enlazada ({@code siguiente} + {@code anterior}) con
 * append O(1) por {@code colaReporte} y re-ordenamiento bajo demanda via
 * {@code reporteOrdenado} (ver docs/diseno-optimizado-estructura.md).
 */
public class BancoEstructura {

    private static final int TAMANO_TABLA_DEFAULT = 101;

    private final TablaHash tabla;
    private NodoHibrido cabezaReporte;
    private NodoHibrido colaReporte;
    private boolean reporteGenerado;
    private boolean reporteOrdenado;

    public BancoEstructura() {
        this(TAMANO_TABLA_DEFAULT);
    }

    public BancoEstructura(int tamanoTabla) {
        this.tabla = new TablaHash(tamanoTabla);
        this.cabezaReporte = null;
        this.colaReporte = null;
        this.reporteGenerado = false;
        this.reporteOrdenado = false;
    }

    public int getTamanoTabla() {
        return tabla.getTamano();
    }

    public boolean isReporteGenerado() {
        return reporteGenerado;
    }

    public boolean isReporteOrdenado() {
        return reporteOrdenado;
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

        ExtremosLista extremos = ReporteLista.encadenarAlFinal(cabezaReporte, colaReporte, nuevo);
        cabezaReporte = extremos.cabeza;
        colaReporte = extremos.cola;
        reporteGenerado = true;
        if (reporteOrdenado) {
            reporteOrdenado = false;
        }

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
            ExtremosLista extremos = ReporteLista.desenganchar(cabezaReporte, colaReporte, objetivo);
            cabezaReporte = extremos.cabeza;
            colaReporte = extremos.cola;
            if (cabezaReporte == null) {
                reporteGenerado = false;
                reporteOrdenado = false;
            }
        }

        tabla.setRaizPorCuenta(cuenta, ArbolRojoNegro.eliminar(raiz, objetivo));
        return true;
    }

    /**
     * Devuelve la cabeza del reporte ordenado por cuenta.
     * <ul>
     *   <li>O(1) si la lista ya esta ordenada y no hubo inserts desde el ultimo merge.</li>
     *   <li>O(n log n) si hubo inserts (lista sucia) o aun no existe lista reporte.</li>
     * </ul>
     *
     * @return cabeza de la lista enlazada ordenada por {@code siguiente}.
     */
    public NodoHibrido generarReporteOrdenado() {
        if (tabla.contarClientes() == 0) {
            cabezaReporte = null;
            colaReporte = null;
            reporteGenerado = false;
            reporteOrdenado = false;
            return null;
        }

        if (!reporteGenerado || cabezaReporte == null) {
            ExtremosLista extremos = ReporteLista.armarDesdeBosque(tabla.getCasilleros());
            cabezaReporte = ReporteLista.mergeSortLista(extremos.cabeza);
            colaReporte = ReporteLista.obtenerCola(cabezaReporte);
            reporteGenerado = true;
            reporteOrdenado = true;
            return cabezaReporte;
        }

        if (reporteOrdenado) {
            return cabezaReporte;
        }

        cabezaReporte = ReporteLista.mergeSortLista(cabezaReporte);
        colaReporte = ReporteLista.obtenerCola(cabezaReporte);
        reporteOrdenado = true;
        return cabezaReporte;
    }

    /**
     * Entrega la cabeza del reporte ya generado (puede no estar ordenada si hubo inserts).
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
}
