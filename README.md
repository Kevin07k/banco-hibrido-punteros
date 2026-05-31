# Banco híbrido por punteros

**Carpeta del proyecto:** `banco-hibrido-punteros`

Proyecto de Estructuras de Datos: banco en **Java puro** con tabla hash, árbol rojo-negro por balde y reporte ordenado usando solo el puntero `siguiente` en `NodoHibrido` (sin `java.util` para el reporte).

El diseño completo del equipo (roles, fases e integración) está en el documento **`Plan_Proyecto.pdf`** (*Diseño de arquitectura y roles del proyecto — Sistema bancario por punteros*). Conserven una copia en el grupo; este README es un resumen mínimo para arrancar.

---

## Cómo funciona la estructura de datos

El banco no usa `HashMap` ni `TreeMap` de Java. Todo está hecho a mano con punteros.

### Tabla hash + árboles rojo-negro

Hay un **arreglo fijo de casilleros** (`TablaHash`). Cada posición apunta a la raíz de un **árbol rojo-negro (RBT)** propio:

```
casilleros[0] → (árbol RBT del balde 0)
casilleros[1] → (árbol RBT del balde 1)
...
casilleros[i] → (árbol RBT del balde i)
```

Para ubicar un cliente se calcula `cuenta % tamaño_tabla`. Si varias cuentas caen en el mismo casillero (colisión), **no se encadenan en lista**: comparten el mismo balde y se ordenan dentro de su RBT por número de cuenta.

- **Insertar / buscar / eliminar:** hash → balde → recorrer solo ese árbol.
- **Complejidad típica:** hash O(1) + árbol O(log n) por balde.

### Nodo híbrido (un solo objeto, dos roles)

Cada cliente vive en un `NodoHibrido` que guarda el `Cliente` y **dos canales de punteros a la vez**:

| Canal | Punteros | Para qué |
|-------|----------|----------|
| **Árbol RBT** | `izquierdo`, `derecho`, `padre`, `esRojo` | Estructura del balde (búsqueda e inserción) |
| **Reporte** | `siguiente` | Lista enlazada global, independiente del árbol |

Así no se duplican nodos: el mismo objeto sirve para el árbol **y** para armar el reporte, sin mezclar los punteros del BST con los de la lista.

### Reporte ordenado (sin `java.util`)

Cuando se pide el reporte global (`generarReporteOrdenado()`):

1. **Encadenar (inorden):** se recorre casillero por casillero; en cada balde con datos, un recorrido **inorden** del RBT enlaza los nodos con `siguiente`. Resultado: una sola lista, aún desordenada entre baldes.
2. **Ordenar (MergeSort):** se ordena esa lista por número de cuenta usando solo `siguiente`. Los punteros del árbol (`izquierdo`, `derecho`, `padre`) **no se tocan**.
3. **Mostrar:** Luna (capa presentación) recorre la lista con `while (actual != null)` y `actual.getSiguiente()`.

La fachada que orquesta todo esto es `BancoEstructura`; la lógica interna vive en `TablaHash`, `ArbolRojoNegro` y `ReporteLista`.

Diagrama de clases y simulador paso a paso: [`docs/diagrama-clases.md`](docs/diagrama-clases.md) y [`docs/simulador/`](docs/simulador/).

---

## Resumen del plan (según `Plan_Proyecto.pdf`)

| Capa | Responsables | Qué hace |
|------|--------------|----------|
| **Captura y menú** | Fernando, Leandro | Menú consola, `Scanner` seguro, validaciones (saldo, cuenta única, baja con saldo 0). |
| **Motor de datos** | Kevin | `TablaHash`, `ArbolRojoNegro`, inserción/búsqueda/baja, reporte por inorden + merge de listas. |
| **Presentación del reporte** | Luna | Tabla alineada en consola recorriendo la lista unificada (`siguiente`). |

**Idea central:** flujo por punteros en tres niveles — captura → almacenamiento indexado (hash + RBT) → extracción y fusión sin arreglos auxiliares para el reporte global.

**Orden de integración sugerido:** (1) nodos y hash + menú base → (2) validaciones acopladas al motor → (3) reporte creciente y salida visual.

---

## Estructura del repositorio

```
src/
  Main.java                 # Demo temporal de la capa datos (Kevin)
  datos/
    Cliente.java
    BancoEstructura.java    # Fachada pública
    NodoHibrido.java
    interno/
      TablaHash.java
      ArbolRojoNegro.java
      ReporteLista.java
docs/
  diagrama-clases.md        # Diagrama Mermaid (GitHub / IDE)
  simulador/                # Web interactiva (HTML/JS)
```

---

## Cómo ejecutar el proyecto Java

Requisito: **JDK 21+** (el proyecto usa `void main()` sin clase envolvente).

### Opción A — IntelliJ IDEA

1. Abrir la carpeta del proyecto.
2. Marcar `src` como *Sources Root* si hace falta.
3. Ejecutar `Main.java`.

### Opción B — Terminal

Desde la raíz del proyecto:

```bash
mkdir -p out
find src -name "*.java" > sources.txt
javac -d out @sources.txt
java -cp out Main
```

La demo inserta clientes de prueba, imprime el reporte ordenado por cuenta, elimina una cuenta y muestra el conteo.

> **Nota:** `Main` es solo prueba de la capa datos. El entry point final del equipo será el menú en `presentacion` (Fernando), cuando esté integrado.

---

## Documentación

Todo está en [`docs/`](docs/):

- **[`docs/diagrama-clases.md`](docs/diagrama-clases.md)** — diagrama de clases (Mermaid).
- **[`docs/simulador/`](docs/simulador/)** — simulador paso a paso (hash, RBT, reporte).

**Simulador web:**

```bash
cd docs/simulador
python3 -m http.server 8080
```

→ `http://localhost:8080`

Índice completo: [`docs/README.md`](docs/README.md).

---

## Qué puede hacer cada compañero ya

| Persona | En este repo |
|---------|----------------|
| **Kevin** | Capa `datos/` lista; ampliar menú demo o APIs que pidan los demás. |
| **Fernando** | Crear `presentacion/MenuPrincipal.java` y llamar a `BancoEstructura`. |
| **Leandro** | Validaciones antes de `insertar` / `eliminar`; usar `buscar` para duplicados. |
| **Luna** | Recibir `NodoHibrido` cabeza de `generarReporteOrdenado()` y recorrer `getSiguiente()`. |

---

## Restricciones del docente (recordatorio)

- No usar colecciones `java.util.*` para armar u ordenar el reporte general.
- Reporte: recorrido inorden por balde + encadenar con `siguiente` + `mergeSortLista` por punteros.
- Tabla hash: arreglo de casilleros; cada colisión es un **árbol RBT propio**.

