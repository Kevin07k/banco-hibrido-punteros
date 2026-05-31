package datos;

/**
 * Entidad pura de datos de un cliente bancario.
 * Molde encapsulado: cuenta, nombre, tipo y saldo.
 */
public class Cliente {

    private long cuenta;
    private String nombre;
    private String tipo;
    private double saldo;

    public Cliente(long cuenta, String nombre, String tipo, double saldo) {
        this.cuenta = cuenta;
        this.nombre = nombre;
        this.tipo = tipo;
        this.saldo = saldo;
    }

    public long getCuenta() {
        return cuenta;
    }

    public void setCuenta(long cuenta) {
        this.cuenta = cuenta;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public double getSaldo() {
        return saldo;
    }

    public void setSaldo(double saldo) {
        this.saldo = saldo;
    }

    @Override
    public String toString() {
        return "Cliente{cuenta=" + cuenta
                + ", nombre='" + nombre + '\''
                + ", tipo='" + tipo + '\''
                + ", saldo=" + saldo
                + '}';
    }
}
