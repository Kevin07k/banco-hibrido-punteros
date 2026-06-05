package presentacion;

import datos.Cliente;
import datos.NodoHibrido;

/**
 * Capa de Presentación e Interfaz de Reportes — Luna.
 *
 * Responsabilidades según el plan de arquitectura:
 *  1. Maquetado Estético de Tablas: formato visual alineado por columnas.
 *  2. Pintado Secuencial: recibe la cabeza de la lista unificada que
 *     produjo Kevin (Inorden + MergeSort por punteros) y ejecuta un
 *     bucle lineal O(N) sin arrays auxiliares para imprimir las filas
 *     en orden creciente por número de cuenta.
 */
public class ReporteImpresora {

    // ── Plantillas de formato ─────────────────────────────────────────────
    private static final String BORDE_DOBLE =
        "+===========+================================+============+==================+";
    private static final String BORDE_SIMPLE =
        "+-----------+--------------------------------+------------+------------------+";
    private static final String PLANTILLA_CABECERA =
        "| %-9s | %-30s | %-10s | %-16s |";
    private static final String PLANTILLA_FILA =
        "| %-9d | %-30s | %-10s | %16.2f |";
    private static final String PLANTILLA_TOTAL =
        "| Total de clientes: %-51d |";

    // ── API pública ───────────────────────────────────────────────────────

    /**
     * Punto de entrada del pintado secuencial.
     *
     * Recibe la {@code cabeza} del {@link NodoHibrido} que retorna
     * {@code BancoEstructura.generarReporteOrdenado()} y recorre la lista
     * enlazada mediante el puntero {@code siguiente} hasta {@code null}.
     *
     * @param cabeza primer nodo de la lista ordenada generada por Kevin
     */
    public void imprimirReporte(NodoHibrido cabeza) {
        imprimirTitulo();

        if (cabeza == null) {
            imprimirVacio();
            return;
        }

        imprimirEncabezadoColumnas();
        int total = pintarFilas(cabeza);   // O(N) por puntero siguiente
        imprimirPie(total);
    }

    /**
     * Imprime la ficha de un único cliente (usado en la opción Buscar).
     *
     * @param c cliente encontrado por {@code BancoEstructura.buscar()}
     */
    public void imprimirFichaCliente(Cliente c) {
        System.out.println();
        System.out.println("  +------------------------------------------+");
        System.out.println("  |          DATOS DEL CLIENTE               |");
        System.out.println("  +------------------------------------------+");
        System.out.printf ("  |  N° Cuenta : %-27d |%n", c.getCuenta());
        System.out.printf ("  |  Nombre    : %-27s |%n", c.getNombre());
        System.out.printf ("  |  Tipo      : %-27s |%n", c.getTipo());
        System.out.printf ("  |  Saldo     : %-24.2f Bs. |%n", c.getSaldo());
        System.out.println("  +------------------------------------------+");
        System.out.println();
    }

    // ── Secciones internas del reporte ────────────────────────────────────

    private void imprimirTitulo() {
        System.out.println();
        System.out.println("  ╔══════════════════════════════════════════════════════════════════════╗");
        System.out.println("  ║       REPORTE GENERAL DE CLIENTES  —  ORDEN CRECIENTE POR CUENTA    ║");
        System.out.println("  ╚══════════════════════════════════════════════════════════════════════╝");
        System.out.println();
    }

    private void imprimirEncabezadoColumnas() {
        System.out.println(BORDE_DOBLE);
        System.out.printf(PLANTILLA_CABECERA + "%n",
                "N° CUENTA", "NOMBRE", "TIPO", "SALDO (Bs.)");
        System.out.println(BORDE_DOBLE);
    }

    /**
     * Bucle lineal — único recorrido por puntero {@code siguiente}.
     * No usa arrays ni colecciones auxiliares.
     *
     * @return cantidad de filas impresas
     */
    private int pintarFilas(NodoHibrido cabeza) {
        int contador = 0;
        NodoHibrido actual = cabeza;          // puntero cabeza de Kevin

        while (actual != null) {
            Cliente c = actual.getDatos();
            System.out.printf(PLANTILLA_FILA + "%n",
                    c.getCuenta(),
                    c.getNombre(),
                    c.getTipo(),
                    c.getSaldo());
            System.out.println(BORDE_SIMPLE);

            actual = actual.getSiguiente();   // avanza al siguiente nodo
            contador++;
        }

        return contador;
    }

    private void imprimirPie(int total) {
        System.out.printf(PLANTILLA_TOTAL + "%n", total);
        System.out.println(BORDE_DOBLE);
        System.out.println();
    }

    private void imprimirVacio() {
        System.out.println(BORDE_DOBLE);
        System.out.println("|              No hay clientes registrados en el sistema.              |");
        System.out.println(BORDE_DOBLE);
        System.out.println();
    }
}
