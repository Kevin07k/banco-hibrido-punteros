import datos.BancoEstructura;
import datos.Cliente;
import datos.NodoHibrido;

/**
 * Punto de entrada temporal para validar la capa de datos (Kevin).
 * Fernando integrara {@code presentacion.MenuPrincipal} como entry point final.
 */
void main() {
    BancoEstructura banco = new BancoEstructura();

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
}
