package negocio;
import datos.BancoEstructura;
import datos.Cliente;

public class GestorNegocio {
    private final BancoEstructura banco;

    public GestorNegocio(BancoEstructura banco){
        this.banco = banco;
    }

    public boolean registrarCliente(long cuenta, String nombre , String tipo , double saldoInicial){
        if(saldoInicial < 0) {
            System.out.println("Error: El daldo incial no puede ser negativo.");
            return false;
        }

        if(banco.existeCuenta(cuenta)){
            System.out.println("Error: La cuenta" + cuenta + " ya esta registrada en el sistema.");
            return false;
        }
        Cliente nuevoCliente = new Cliente(cuenta , nombre , tipo , saldoInicial);
        boolean exito = banco.insertar(nuevoCliente);

        if(exito){
            System.out.println("Exito: Cliente" + nombre + " registrado correctamente.");
        }
        return exito;
    }

    public boolean darDeBajaCliente(long cuenta){
        Cliente cliente = banco.buscar(cuenta);
        if(cliente == null){
            System.out.println("Error: No se encontro la cuenta " + cuenta +".");
            return false;
        }

        if(cliente.getSaldo() != 0){
            System.out.println("Error: No se pudo dar de baja. El saldo actual es" + cliente.getSaldo() + " Debe ser de 0.00");
            return false;
        }

        boolean exito = banco.eliminar(cuenta);

        if(exito){
            System.out.println("Exito: La cuenta " + cuenta + " ha sido dada de baja del sistema.");
        }
        return true;
    }
}
