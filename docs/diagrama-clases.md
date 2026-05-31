# Diagrama de clases — Sistema bancario híbrido

Vista del equipo según `Plan_Proyecto.pdf`. Lo implementado hoy está en `src/datos/`; el resto son capas que integrarán Fernando, Leandro y Luna.

- **API pública (Kevin):** `src/datos/` — `Cliente`, `NodoHibrido`, `BancoEstructura`
- **Interno:** `src/datos/interno/` — `TablaHash`, `ArbolRojoNegro`, `ReporteLista`
- **Simulador animado:** [`simulador/`](simulador/)

```mermaid
classDiagram
    direction TB

    class Main {
        +main() void
    }

    class MenuPrincipal {
        -Scanner scanner
        +iniciar() void
        +mostrarMenu() void
        +capturarCliente() Cliente
    }

    class ReportePantalla {
        +imprimirTabla(NodoHibrido cabeza) void
        +recorrerReporte(NodoHibrido cabeza) void
    }

    class ClienteNegocio {
        -BancoEstructura banco
        +registrar(Cliente cliente) boolean
        +validarSaldo(double saldo) boolean
        +validarCuentaUnica(long cuenta) boolean
        +buscar(long cuenta) Cliente
        +eliminar(long cuenta) boolean
        +generarReporte() NodoHibrido
    }

    class Cliente {
        -long cuenta
        -String nombre
        -String tipo
        -double saldo
        +getCuenta() long
        +getNombre() String
        +getTipo() String
        +getSaldo() double
    }

    class NodoHibrido {
        -Cliente datos
        -NodoHibrido izquierdo
        -NodoHibrido derecho
        -NodoHibrido padre
        -NodoHibrido siguiente
        -boolean esRojo
        +getDatos() Cliente
        +getSiguiente() NodoHibrido
        +getCuenta() long
    }

    class BancoEstructura {
        -TablaHash tabla
        -NodoHibrido cabezaReporte
        -boolean reporteGenerado
        +insertar(Cliente) boolean
        +buscar(long) Cliente
        +existeCuenta(long) boolean
        +eliminar(long) boolean
        +generarReporteOrdenado() NodoHibrido
        +obtenerCabezaReporte() NodoHibrido
        +contarClientes() int
    }

    class TablaHash {
        -NodoHibrido[] casilleros
        +calcularIndice(long) int
        +getRaiz(int) NodoHibrido
        +setRaiz(int, NodoHibrido) void
        +contarClientes() int
    }

    class ArbolRojoNegro {
        +buscar(NodoHibrido, long) NodoHibrido$
        +insertar(NodoHibrido, NodoHibrido) NodoHibrido$
        +eliminar(NodoHibrido, NodoHibrido) NodoHibrido$
        +contar(NodoHibrido) int$
    }

    class ReporteLista {
        +generarOrdenado(NodoHibrido[]) NodoHibrido$
        +limpiarEnlaces(NodoHibrido[]) void$
        +desenganchar(NodoHibrido, NodoHibrido) NodoHibrido$
    }

    namespace presentacion {
        class MenuPrincipal
        class ReportePantalla
    }

    namespace negocio {
        class ClienteNegocio
    }

    namespace datos {
        class Cliente
        class NodoHibrido
        class BancoEstructura
    }

    namespace datos_interno {
        class TablaHash
        class ArbolRojoNegro
        class ReporteLista
    }

    Main ..> BancoEstructura : demo actual
    Main ..> MenuPrincipal : futuro

    MenuPrincipal --> ClienteNegocio
    ClienteNegocio --> BancoEstructura
    ReportePantalla ..> NodoHibrido

    BancoEstructura --> TablaHash
    BancoEstructura --> ArbolRojoNegro
    BancoEstructura --> ReporteLista
    BancoEstructura --> NodoHibrido : cabezaReporte

    TablaHash "1" *-- "N" NodoHibrido : casilleros[]
    ArbolRojoNegro ..> NodoHibrido : izquierdo, derecho, padre
    ReporteLista ..> NodoHibrido : siguiente

    NodoHibrido --> Cliente : datos
```

## Estructura de carpetas

```
src/datos/
├── Cliente.java           ← API publica (entidad)
├── NodoHibrido.java       ← API publica (nodo hibrido)
├── BancoEstructura.java   ← API publica (fachada)
└── interno/
    ├── TablaHash.java     ← arreglo hash
    ├── ArbolRojoNegro.java← balanceo por balde
    └── ReporteLista.java  ← inorden + MergeSort
```

## Leyenda

| Simbolo | Significado |
|---------|-------------|
| Canal arbol RBT | `izquierdo`, `derecho`, `padre`, `esRojo` — solo `ArbolRojoNegro` |
| Canal reporte | `siguiente` — solo `ReporteLista` |
| `casilleros[]` | Arreglo estatico; indice = `cuenta % tamano` |

## Flujo entre capas

```mermaid
flowchart LR
    A[MenuPrincipal] --> B[ClienteNegocio]
    B --> C[BancoEstructura]
    C --> D[ReportePantalla]
    C --> E[interno]
    E --> F[TablaHash]
    E --> G[ArbolRojoNegro]
    E --> H[ReporteLista]
```
