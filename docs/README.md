# Documentación del proyecto

Todo lo que **no es código Java** del banco vive aquí. El código fuente sigue solo en `src/`.

| Qué necesitas | Dónde |
|---------------|--------|
| **Diagrama de clases** (Mermaid, capas del equipo) | [`diagrama-clases.md`](diagrama-clases.md) — se ve bien en GitHub |
| **Diseño optimizado** (reporte: cola, doble enlace, flags, casos) | [`diseno-optimizado-estructura.md`](diseno-optimizado-estructura.md) |
| **Simulador interactivo** (hash, RBT, reporte, animaciones) | carpeta [`simulador/`](simulador/) |
| **Plan oficial del equipo** (roles, cronograma) | `Plan_Proyecto.pdf` (copia del grupo, no está en el repo) |

---

## Simulador web

Animaciones paso a paso alineadas con `src/datos/` (misma lógica de negocio en JavaScript: hash, RBT, `ReporteLista`, flags de reporte). **No sustituye** al código Java del docente; sirve para ver punteros, casos teóricos y el merge.

### Cómo levantarlo

```bash
cd docs/simulador
python3 -m http.server 8080
```

Abre **http://localhost:8080** → [`simulador/index.html`](simulador/index.html) es la portada.

### Páginas

| Página | Archivo | Para qué sirve |
|--------|---------|----------------|
| Portada | [`simulador/index.html`](simulador/index.html) | Enlaces a todas las vistas |
| **Simulador completo** | [`simulador/interactivo.html`](simulador/interactivo.html) | Tabla hash + árbol del balde + MergeSort + lista enlazada en **un solo canvas**; insertar, buscar, eliminar, reporte |
| Mapa de funciones | [`simulador/funciones.html`](simulador/funciones.html) | Flujo insertar / buscar / eliminar / `generarReporteOrdenado` con diagramas |
| Árbol R-N aislado | [`simulador/arbol-rojo-negro.html`](simulador/arbol-rojo-negro.html) | Solo inserción RBT paso a paso |
| **Casos R-N (guía)** | [`simulador/rbt-casos.html`](simulador/rbt-casos.html) | Los 5 casos de inserción y 6 de eliminación; glosario N, P, T, A, H, V; comparadores Antes/Después |
| Ordenamiento | [`simulador/ordenamiento-punteros.html`](simulador/ordenamiento-punteros.html) | Solo MergeSort por `siguiente` (laboratorio aparte) |

### Vista unificada (`interactivo.html`)

- **Layout:** hash vertical a la izquierda; árbol del balde activo y árbol de recursión del MergeSort a la derecha; **lista enlazada a ancho completo abajo** (con scroll horizontal si hay muchos nodos).
- **Escenarios prearmados** ([`js/escenarios.js`](simulador/js/escenarios.js)): bosques listos para probar el reporte sin insertar uno a uno. Incluye colisiones fuertes (p. ej. ~10 cuentas en un mismo balde, combinaciones 10+7+5, etc.).
- **Clic en un casillero** del canvas cambia el balde activo y redibuja su árbol.

### Alineación con el Java del reporte

El motor de pasos ([`js/motor-animacion.js`](simulador/js/motor-animacion.js)) replica el diseño optimizado:

| Momento | Comportamiento en Java | Comportamiento en el simulador |
|---------|------------------------|--------------------------------|
| **Insertar** | `ReporteLista.encadenarAlFinal` → O(1); `reporteOrdenado = false` si había orden | Paso `encadenarAlFinal`; la lista global crece en orden de inserción |
| **Eliminar** | `desenganchar` en O(1); la lista puede seguir ordenada | Pasos de baja en árbol + desenganche de la lista |
| **Generar reporte** con lista ya armada | Solo `mergeSortLista` (sin recorrer baldes en inorden) | **No** repite inorden por balde; va directo al MergeSort |
| **Generar** si `reporteOrdenado` | O(1), retorna cabeza | Un paso explicativo, sin re-merge |
| Sin lista previa | `armarDesdeBosque` (inorden) + merge | Sí muestra fase inorden (camino legacy) |

### Árbol de MergeSort

[`js/merge-sort-viz.js`](simulador/js/merge-sort-viz.js) dibuja cada sublista con **cajas por cuenta** (espaciado moderado), no solo un rango `min … max`, para seguir la recursión divide/merge.

### Casos rojo-negro

- Etiquetas en canvas: tío (T), padre (P), abuelo (A), hermano (H), pivote, etc.
- Textos didácticos (situación → violación → solución) en [`rbt-casos.html`](simulador/rbt-casos.html).
- Numeración y condiciones: tabla en [`AGENT.md`](../AGENT.md) §6.

### Módulos JS principales

| Archivo | Rol |
|---------|-----|
| `nucleo.js` | Réplica de `Cliente`, `NodoHibrido`, hash, RBT, `encadenarAlFinal` |
| `motor-animacion.js` | Genera la secuencia de pasos (insertar, buscar, eliminar, reporte) |
| `sistema-visual-unificado.js` | Un canvas, layout por zonas, GSAP |
| `reproductor.js` | Controles paso a paso + resumen en lenguaje claro |
| `escenarios.js` | Datos de prueba precargados |
| `rbt-aprendizaje.js` | Diagramas estáticos y morph para la guía RBT |
| `serializacion.js` | Snapshot de casilleros entre pasos |

---

## Diagrama de clases

Abre [`diagrama-clases.md`](diagrama-clases.md) en GitHub o en el IDE (vista previa Mermaid).

Incluye la API actual de Kevin (`datos/`, `datos/interno/`) y las clases futuras de Fernando, Leandro y Luna (`presentacion`, `negocio`).

---

## Por qué una sola carpeta `docs/`

Antes el diagrama estaba en `src/doc/` (mezclado con código) y la web en `documentacion/` (otro nombre). Ahora:

- **`src/`** = solo Java ejecutable  
- **`docs/`** = todo lo demás para leer y practicar
