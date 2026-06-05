import datos.BancoEstructura;
import datos.Cliente;
import datos.NodoHibrido;
import negocio.GestorNegocio;
import presentacion.MenuPrincipal2;

/**
 * Punto de entrada temporal para validar la capa de datos (Kevin).
 * Fernando integrara {@code presentacion.MenuPrincipal} como entry point final.
 */
void main() {

    MenuPrincipal2 menu =
            new MenuPrincipal2();

    menu.iniciar();


    BancoEstructura banco = new BancoEstructura();
    GestorNegocio gestor = new GestorNegocio(banco);
    banco.insertar(new Cliente(1003, "Ana Lopez", "Ahorro", 1500.50));
    banco.insertar(new Cliente(1001, "Carlos Ruiz", "Corriente", 3200.00));
    banco.insertar(new Cliente(1002, "Maria Gomez", "Ahorro", 780.25));
    banco.insertar(new Cliente(1204, "Pedro Diaz", "Corriente", 9100.00));

    IO.println("=== Demo capa datos (Kevin) ===");
    IO.println("Clientes registrados: " + banco.contarClientes());
    IO.println("Busqueda cuenta 1002: " + banco.buscar(1002));
    IO.println("Cuenta duplicada 1001: " + banco.insertar(new Cliente(1001, "Otro", "Ahorro", 1.0)));

    IO.println("\nReporte ordenado por cuenta (puntero siguiente):");
    NodoHibrido actual = banco.generarReporteOrdenado();
    while (actual != null) {
        Cliente c = actual.getDatos();
        IO.println(String.format("%6d | %-12s | %-9s | %10.2f",
                c.getCuenta(), c.getNombre(), c.getTipo(), c.getSaldo()));
        actual = actual.getSiguiente();
    }

    IO.println("\nEliminando cuenta 1002...");
    banco.eliminar(1002);
    IO.println("Clientes restantes: " + banco.contarClientes());

    // 1. Intentar registrar con saldo negativo (Tu filtro debe bloquearlo)
    gestor.registrarCliente(1001, "Luis", "Ahorro", -50.0);

    // 2. Registrar correctamente
    gestor.registrarCliente(1002, "Maria", "Corriente", 100.0);

    // 3. Intentar duplicar la cuenta (Tu filtro debe bloquearlo)
    gestor.registrarCliente(1002, "Clon de Maria", "Ahorro", 500.0);

    // 4. Intentar dar de baja con dinero en la cuenta (Tu filtro debe bloquearlo)
    gestor.darDeBajaCliente(1002);

    // 5. Registrar cuenta en cero y darla de baja con éxito
    gestor.registrarCliente(1003, "Pedro", "Ahorro", 0.0);
    gestor.darDeBajaCliente(1003);
}
