package presentacion;

import datos.BancoEstructura;
import datos.Cliente;
import datos.NodoHibrido;

import java.util.Scanner;

public class MenuPrincipal2 {

    private Scanner sc;
    private BancoEstructura banco;

    public MenuPrincipal2() {
        sc = new Scanner(System.in);
        banco = new BancoEstructura();
    }

    public void iniciar() {

        int opcion;

        do {
            mostrarMenu();
            opcion = leerEntero("Seleccione opción: ");

            switch(opcion) {

                case 1:
                    registrarCliente();
                    break;

                case 2:
                    buscarCliente();
                    break;

                case 3:
                    eliminarCliente();
                    break;

                case 4:
                    mostrarReporte();
                    break;

                case 5:
                    System.out.println("Saliendo...");
                    break;

                default:
                    System.out.println("Opción inválida");
            }

        } while(opcion != 5);
    }

    private void mostrarMenu() {

        System.out.println("\n=== BANCO ===");
        System.out.println("1. Registrar");
        System.out.println("2. Buscar");
        System.out.println("3. Eliminar");
        System.out.println("4. Reporte");
        System.out.println("5. Salir");
    }

    private int leerEntero(String mensaje){

        while(true){

            try{

                System.out.print(mensaje);

                int dato =
                        Integer.parseInt(sc.nextLine());

                return dato;

            }catch(Exception e){

                System.out.println(
                        "Ingrese números válidos"
                );
            }
        }
    }


    private long leerLong(String mensaje){

        while(true){

            try{

                System.out.print(mensaje);

                return Long.parseLong(
                        sc.nextLine()
                );

            }catch(Exception e){

                System.out.println(
                        "Número inválido"
                );
            }
        }
    }


    private double leerDouble(String mensaje){

        while(true){

            try{

                System.out.print(mensaje);

                return Double.parseDouble(
                        sc.nextLine()
                );

            }catch(Exception e){

                System.out.println(
                        "Monto inválido"
                );
            }
        }
    }


    private void registrarCliente(){

        long cuenta =
                leerLong("Cuenta: ");

        if(banco.existeCuenta(cuenta)){

            System.out.println(
                    "La cuenta ya existe"
            );

            return;
        }

        System.out.print(
                "Nombre: "
        );

        String nombre =
                sc.nextLine();

        System.out.print(
                "Tipo: "
        );

        String tipo =
                sc.nextLine();

        double saldo =
                leerDouble("Saldo: ");

        if(saldo < 0){

            System.out.println(
                    "Saldo inválido"
            );

            return;
        }

        boolean ok =
                banco.insertar(
                        new Cliente(
                                cuenta,
                                nombre,
                                tipo,
                                saldo
                        )
                );

        if(ok){

            System.out.println(
                    "Cliente registrado"
            );

        }else{

            System.out.println(
                    "Error"
            );
        }
    }


    private void buscarCliente(){

        long cuenta =
                leerLong("Cuenta: ");

        Cliente c =
                banco.buscar(cuenta);

        if(c == null){

            System.out.println(
                    "No encontrado"
            );

            return;
        }

        System.out.println(
                c
        );
    }


    private void eliminarCliente(){

        long cuenta =
                leerLong("Cuenta: ");

        Cliente c =
                banco.buscar(cuenta);

        if(c == null){

            System.out.println(
                    "No existe"
            );

            return;
        }

        if(c.getSaldo() != 0){

            System.out.println(
                    "Saldo debe ser 0"
            );

            return;
        }

        banco.eliminar(cuenta);

        System.out.println(
                "Eliminado"
        );
    }


    private void mostrarReporte(){

        NodoHibrido actual =
                banco.generarReporteOrdenado();

        if(actual == null){

            System.out.println(
                    "Sin clientes"
            );

            return;
        }

        System.out.println(
                "CUENTA   NOMBRE      TIPO     SALDO"
        );

        while(actual != null){

            Cliente c =
                    actual.getDatos();

            System.out.printf(
                    "%6d %-10s %-10s %.2f\n",

                    c.getCuenta(),
                    c.getNombre(),
                    c.getTipo(),
                    c.getSaldo()
            );

            actual =
                    actual.getSiguiente();
        }
    }
}


