package negocio;

import datos.BancoEstructura;
import datos.Cliente;
import datos.NodoHibrido;

/**
 * Capa de negocio — validaciones y orquestacion sobre {@link BancoEstructura}.
 */
public class GestorNegocio {

    public enum Resultado {
        OK,
        SALDO_NEGATIVO,
        CUENTA_DUPLICADA,
        CUENTA_NO_ENCONTRADA,
        SALDO_NO_CERO,
        NOMBRE_VACIO,
        ERROR_ELIMINACION,
        ERROR_ACTUALIZACION
    }

    private final BancoEstructura banco;

    public GestorNegocio(BancoEstructura banco) {
        this.banco = banco;
    }

    public Resultado registrarCliente(long cuenta, String nombre, String tipo, double saldoInicial) {
        if (saldoInicial < 0) {
            return Resultado.SALDO_NEGATIVO;
        }

        if (banco.existeCuenta(cuenta)) {
            return Resultado.CUENTA_DUPLICADA;
        }

        Cliente nuevoCliente = new Cliente(cuenta, nombre, tipo, saldoInicial);
        return banco.insertar(nuevoCliente) ? Resultado.OK : Resultado.CUENTA_DUPLICADA;
    }

    public Resultado editarCliente(long cuenta, String nombre, double saldo) {
        if (nombre == null || nombre.isBlank()) {
            return Resultado.NOMBRE_VACIO;
        }

        if (saldo < 0) {
            return Resultado.SALDO_NEGATIVO;
        }

        if (!banco.existeCuenta(cuenta)) {
            return Resultado.CUENTA_NO_ENCONTRADA;
        }

        return banco.actualizar(cuenta, nombre, saldo) ? Resultado.OK : Resultado.ERROR_ACTUALIZACION;
    }

    public Resultado darDeBajaCliente(long cuenta) {
        Cliente cliente = banco.buscar(cuenta);
        if (cliente == null) {
            return Resultado.CUENTA_NO_ENCONTRADA;
        }

        if (cliente.getSaldo() != 0.0) {
            return Resultado.SALDO_NO_CERO;
        }

        return banco.eliminar(cuenta) ? Resultado.OK : Resultado.ERROR_ELIMINACION;
    }

    public Cliente buscarCliente(long cuenta) {
        return banco.buscar(cuenta);
    }

    public int contarClientes() {
        return banco.contarClientes();
    }

    public NodoHibrido generarReporteOrdenado() {
        return banco.generarReporteOrdenado();
    }
}
