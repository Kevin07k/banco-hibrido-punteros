package presentacion;

import datos.BancoEstructura;
import datos.Cliente;
import negocio.GestorNegocio;
import negocio.GestorNegocio.Resultado;

/**
 * Capa de presentacion — menu principal.
 *
 * Flujo de tres capas:
 *   Presentacion (esta clase + ReporteImpresora)
 *       → Negocio (GestorNegocio)
 *       → Datos (BancoEstructura)
 */
public class MenuPrincipal {

    // ── Opciones del menú ─────────────────────────────────────────────────
    private static final int OPC_REGISTRAR = 1;
    private static final int OPC_BUSCAR    = 2;
    private static final int OPC_REPORTE   = 3;
    private static final int OPC_BAJA      = 4;
    private static final int OPC_EDITAR    = 5;
    private static final int OPC_SALIR     = 6;

    // ── Dependencias ──────────────────────────────────────────────────────
    private final GestorNegocio    gestor;
    private final ReporteImpresora impresora;

    // ── Constructor ───────────────────────────────────────────────────────
    public MenuPrincipal() {
        this.gestor    = new GestorNegocio(new BancoEstructura());
        this.impresora = new ReporteImpresora();
    }

    // ── Bucle principal ───────────────────────────────────────────────────

    /**
     * Inicia el sistema. Permanece en el bucle hasta que el usuario elija Salir.
     */
    public void iniciar() {
        mostrarBienvenida();

        int opcion;
        do {
            mostrarMenu();
            opcion = leerEntero("  Seleccione una opción: ");

            switch (opcion) {
                case OPC_REGISTRAR -> modoRegistrar();
                case OPC_BUSCAR    -> modoBuscar();
                case OPC_REPORTE   -> modoReporte();
                case OPC_BAJA      -> modoBaja();
                case OPC_EDITAR    -> modoEditar();
                case OPC_SALIR     -> mostrarDespedida();
                default            -> mostrarError("Opción inválida. Ingrese un número del 1 al 6.");
            }

        } while (opcion != OPC_SALIR);
    }

    // ── Opciones ──────────────────────────────────────────────────────────

    /** Opción 1 — Registrar cliente */
    private void modoRegistrar() {
        mostrarSubtitulo("REGISTRAR NUEVO CLIENTE");

        long   cuenta = leerLong  ("  N° de cuenta    : ");
        String nombre = leerTexto ("  Nombre completo : ");
        String tipo   = elegirTipo();
        double saldo  = leerDouble("  Saldo inicial   : ");

        switch (gestor.registrarCliente(cuenta, nombre, tipo, saldo)) {
            case OK               -> mostrarExito("Cliente registrado correctamente.");
            case SALDO_NEGATIVO   -> mostrarError("El saldo inicial no puede ser negativo.");
            case CUENTA_DUPLICADA -> mostrarError("La cuenta N° " + cuenta + " ya existe en el sistema.");
            default               -> mostrarError("No se pudo registrar el cliente.");
        }
    }

    /** Opción 2 — Buscar cliente */
    private void modoBuscar() {
        mostrarSubtitulo("BUSCAR CLIENTE");

        long cuenta = leerLong("  N° de cuenta a buscar: ");
        Cliente encontrado = gestor.buscarCliente(cuenta);

        if (encontrado == null) {
            mostrarError("No existe ningún cliente con la cuenta N° " + cuenta + ".");
            return;
        }

        impresora.imprimirFichaCliente(encontrado);
    }

    /** Opción 3 — Reporte general: Fase 3 del cronograma (Kevin → Luna) */
    private void modoReporte() {
        mostrarSubtitulo("REPORTE GENERAL — ORDEN CRECIENTE POR CUENTA");

        if (gestor.contarClientes() == 0) {
            mostrarError("No hay clientes registrados para generar el reporte.");
            return;
        }

        impresora.imprimirReporte(gestor.generarReporteOrdenado());
    }

    /** Opción 5 — Editar cliente (nombre y saldo por N° de cuenta) */
    private void modoEditar() {
        mostrarSubtitulo("EDITAR CLIENTE");

        long cuenta = leerLong("  N° de cuenta a editar: ");
        Cliente cliente = gestor.buscarCliente(cuenta);

        if (cliente == null) {
            mostrarError("No existe ningún cliente con la cuenta N° " + cuenta + ".");
            return;
        }

        System.out.println("  Datos actuales:");
        impresora.imprimirFichaCliente(cliente);

        String nombre = leerTexto("  Nuevo nombre completo : ");
        double saldo  = leerDouble("  Nuevo saldo           : ");

        switch (gestor.editarCliente(cuenta, nombre, saldo)) {
            case OK -> mostrarExito("Cliente N° " + cuenta + " actualizado correctamente.");
            case SALDO_NEGATIVO -> mostrarError("El saldo no puede ser negativo.");
            case NOMBRE_VACIO -> mostrarError("El nombre no puede estar vacío.");
            case ERROR_ACTUALIZACION -> mostrarError("No se pudo actualizar el cliente.");
            default -> mostrarError("Operación no permitida.");
        }
    }

    /** Opción 4 — Baja de cliente */
    private void modoBaja() {
        mostrarSubtitulo("BAJA DE CLIENTE");

        long cuenta = leerLong("  N° de cuenta a eliminar: ");
        Cliente cliente = gestor.buscarCliente(cuenta);

        if (cliente == null) {
            mostrarError("No existe ningún cliente con la cuenta N° " + cuenta + ".");
            return;
        }

        switch (gestor.darDeBajaCliente(cuenta)) {
            case OK -> mostrarExito("Cuenta N° " + cuenta + " eliminada correctamente.");
            case SALDO_NO_CERO -> mostrarError(String.format(
                "No se puede eliminar la cuenta. El saldo debe ser 0.00 Bs. " +
                "(Saldo actual: %.2f Bs.)", cliente.getSaldo()));
            case ERROR_ELIMINACION -> mostrarError("No se pudo eliminar la cuenta.");
            default -> mostrarError("Operación no permitida.");
        }
    }

    // ── Lectura segura de teclado (try-catch) ─────────────────────────────

    /** Lee un int; repite si el usuario escribe algo que no es número. */
    private int leerEntero(String mensaje) {
        while (true) {
            System.out.print(mensaje);
            try {
                return Integer.parseInt(System.console() != null
                        ? System.console().readLine()
                        : new java.util.Scanner(System.in).nextLine().trim());
            } catch (NumberFormatException e) {
                mostrarError("Entrada inválida. Ingrese un número entero.");
            }
        }
    }

    /** Lee un long; repite si el formato es incorrecto. */
    private long leerLong(String mensaje) {
        while (true) {
            System.out.print(mensaje);
            try {
                return Long.parseLong(leerLinea());
            } catch (NumberFormatException e) {
                mostrarError("Entrada inválida. Ingrese solo dígitos para el número de cuenta.");
            }
        }
    }

    /** Lee un double; acepta coma o punto decimal. */
    private double leerDouble(String mensaje) {
        while (true) {
            System.out.print(mensaje);
            try {
                return Double.parseDouble(leerLinea().replace(',', '.'));
            } catch (NumberFormatException e) {
                mostrarError("Entrada inválida. Ingrese un número decimal (ej: 1500.50).");
            }
        }
    }

    /** Lee una cadena no vacía. */
    private String leerTexto(String mensaje) {
        String entrada;
        do {
            System.out.print(mensaje);
            entrada = leerLinea();
            if (entrada.isEmpty()) mostrarError("El campo no puede estar vacío.");
        } while (entrada.isEmpty());
        return entrada;
    }

    /** Submenú para elegir tipo de cuenta. */
    private String elegirTipo() {
        System.out.println("  Tipo de cuenta:");
        System.out.println("    [1] Ahorro");
        System.out.println("    [2] Corriente");
        int op = leerEntero("  Seleccione tipo: ");
        return (op == 2) ? "Corriente" : "Ahorro";
    }

    /** Lee una línea desde System.in de forma compatible con cualquier entorno. */
    private String leerLinea() {
        try {
            java.io.BufferedReader br = new java.io.BufferedReader(
                    new java.io.InputStreamReader(System.in));
            String linea = br.readLine();
            return (linea == null) ? "" : linea.trim();
        } catch (java.io.IOException e) {
            return "";
        }
    }

    // ── Presentación visual ───────────────────────────────────────────────

    private void mostrarBienvenida() {
        System.out.println();
        System.out.println("  ╔══════════════════════════════════════════════════════╗");
        System.out.println("  ║        SISTEMA BANCARIO — MODELO HÍBRIDO             ║");
        System.out.println("  ║        HashMap  +  Árbol Rojo-Negro  +  Punteros     ║");
        System.out.println("  ╚══════════════════════════════════════════════════════╝");
        System.out.println();
    }

    private void mostrarMenu() {
        System.out.println("  ┌────────────────────────────────────┐");
        System.out.println("  │           MENÚ PRINCIPAL           │");
        System.out.println("  ├────────────────────────────────────┤");
        System.out.println("  │  1. Registrar cliente              │");
        System.out.println("  │  2. Buscar cliente                 │");
        System.out.println("  │  3. Reporte general                │");
        System.out.println("  │  4. Baja de cliente                │");
        System.out.println("  │  5. Editar cliente                 │");
        System.out.println("  │  6. Salir                          │");
        System.out.println("  └────────────────────────────────────┘");
    }

    private void mostrarSubtitulo(String titulo) {
        System.out.println();
        System.out.println("  ── " + titulo + " ──");
        System.out.println();
    }

    private void mostrarExito(String msg) {
        System.out.println();
        System.out.println("  ✔  " + msg);
        System.out.println();
    }

    private void mostrarError(String msg) {
        System.out.println();
        System.out.println("  ✘  " + msg);
        System.out.println();
    }

    private void mostrarDespedida() {
        System.out.println();
        System.out.println("  ╔══════════════════════════════════════════════════════╗");
        System.out.println("  ║   Sesión cerrada. ¡Hasta pronto!                     ║");
        System.out.println("  ╚══════════════════════════════════════════════════════╝");
        System.out.println();
    }
}
