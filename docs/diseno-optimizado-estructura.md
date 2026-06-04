# Diseño optimizado de la estructura (reporte)

Documento de referencia para el equipo: lógica acordada, casos y complejidades.  
Complementa el [README principal](../README.md); no reemplaza las restricciones del docente.

---

## Objetivo

Reducir trabajo redundante respecto al flujo actual (`invalidarReporte` + inorden completo del bosque + merge en cada ciclo), manteniendo:

- Tabla hash + árbol rojo-negro por balde (altas, bajas, búsquedas).
- Reporte global ordenado por **número de cuenta** en el canal reporte de `NodoHibrido`.
- Ordenamiento con **MergeSort por punteros** (solo cuando haga falta; sin `java.util`).

**Idea clave:** separar *“existe lista de reporte”* de *“la lista está ordenada por cuenta”*.

---

## Canales en `NodoHibrido`

| Canal | Punteros | Uso |
|-------|----------|-----|
| Árbol RBT | `izquierdo`, `derecho`, `padre`, `esRojo` | Índice por balde, O(log n) por operación en el árbol |
| Reporte | `siguiente`, **`anterior`** (propuesto) | Lista enlazada del reporte, independiente del árbol |

En `BancoEstructura`:

| Campo | Significado |
|-------|-------------|
| `cabezaReporte` | Primer nodo de la lista reporte |
| `colaReporte` | Último nodo (append en O(1)) |
| `reporteGenerado` | Existe lista reporte armada |
| `reporteOrdenado` | La lista está ordenada por cuenta (merge ya aplicado) |

> Alternativa: `necesitaReordenar` (invertido: `true` tras un insert que dejó la lista sucia).

---

## Invariantes

1. El reporte en pantalla se recorre solo con `siguiente` (Luna); `anterior` sirve para desenganchar en O(1).
2. Los punteros del árbol **no** se mezclan con el recorrido del reporte en presentación.
3. Tras un merge exitoso: cuentas en orden creciente → `reporteOrdenado = true`.
4. Tras **insertar** (append por cola): puede dejar de estar ordenada → `reporteOrdenado = false`.
5. Tras **eliminar** con lista ya ordenada: sigue ordenada → `reporteOrdenado` **permanece true**.
6. No invalidar todo el bosque (`limpiarEnlaces` global) en cada alta/baja, salvo reset o error grave.

---

## Lógica por operación

### Insertar cliente

1. Insertar en RBT del balde → **O(log n)**.
2. Enlazar al final de la lista reporte (cola):
   - `cola.siguiente = nuevo`, `nuevo.anterior = cola`, `cola = nuevo` → **O(1)**.
3. `reporteGenerado = true`.
4. Si `reporteOrdenado` era `true` → **`reporteOrdenado = false`** (nuevo nodo puede quedar fuera de orden).

**No** ejecutar merge aquí.

---

### Eliminar cliente

1. Buscar y eliminar en RBT → **O(log n)**.
2. Si el nodo está en la lista reporte: desenganchar con `anterior` / `siguiente` → **O(1)**.
3. Si se borró la cola → actualizar `colaReporte`.
4. Si la lista estaba ordenada → **`reporteOrdenado` sigue true** (quitar un elemento no desordena).

**No** invalidar todo el bosque ni re-merge solo por una baja.

---

### Generar reporte ordenado (`generarReporteOrdenado`)

```
SI NO reporteGenerado O cabezaReporte == null:
    Armar lista si hace falta (inorden por balde O(n), o ya existe por inserts)
    cabeza = mergeSortLista(cabeza)     → O(n log n)
    reporteGenerado = true
    reporteOrdenado = true
    RETORNAR cabeza

SI reporteOrdenado == true:
    RETORNAR cabezaReporte              → O(1)  (sin inserts desde el último merge)

SI reporteOrdenado == false:
    cabeza = mergeSortLista(cabeza)     → O(n log n)
    reporteOrdenado = true
    RETORNAR cabeza
```

**Paga O(n log n):** hubo al menos un **insert** desde el último merge (lista sucia por append).

**Paga O(1):** se pide generar de nuevo y no hubo inserts (las **bajas no cuentan**).

---

### Mostrar reporte (capa presentación / Luna)

- Recorrer `actual = actual.getSiguiente()` → **O(n)**.
- Antes de imprimir: llamar `generarReporteOrdenado()` o comprobar `reporteOrdenado`; si no, la salida puede estar desordenada.

---

## Casos finales (checklist)

| # | Situación | `reporteGenerado` | `reporteOrdenado` | Al llamar `generarReporte` | Al eliminar | Al insertar |
|---|-----------|-------------------|-------------------|------------------------------|-------------|-------------|
| 1 | Banco vacío | false | false | Armar vacío / sin nodos | — | Primer nodo, ordenado=false |
| 2 | Primera carga, nunca generaron | true (por appends) | false | Inorden (si falta) + merge O(n log n) | O(1) lista; ordenado según estaba | false |
| 3 | Tras generar, sin cambios | true | true | **O(1)** devolver cabeza | — | — |
| 4 | Tras generar, solo **eliminaron** | true | **true** | **O(1)** | O(1) desenganchar; sigue ordenado | — |
| 5 | Tras generar, **insertaron** uno | true | false | **Merge** O(n log n) | O(1); ordenado no cambia por baja sola | Marcar false al insert |
| 6 | Insertaron, aún no generan | true | false | Merge la primera vez que pidan | — | Append O(1) |
| 7 | Varios inserts, un solo generar | true | false → true tras merge | Un merge para todos | — | Cada insert: false |
| 8 | Generar → insert → generar → eliminar → generar | true / false según fila 5–4 | Ver filas 4–5 | 2º generar: merge; 3º generar: O(1) si no hubo insert después del 2º | No fuerza merge | Insert marca sucio |

---

## Tabla de complejidades (objetivo)

| Operación | Tiempo | ¿Merge? |
|-----------|--------|---------|
| Insertar | O(log n) árbol + O(1) lista reporte | No |
| Eliminar | O(log n) árbol + O(1) lista reporte | No |
| Generar (sin inserts desde último merge) | O(1) | No |
| Generar (con inserts desde último merge) | O(n log n) | Sí |
| Imprimir tabla | O(n) recorrido `siguiente` | No (solo mostrar) |

El límite **Θ(n log n)** por comparaciones sigue cuando hay que re-ordenar; se evita inorden + limpiar bosque + merge repetidos sin necesidad.

---

## Comparación con la implementación actual

| Aspecto | Actual | Diseño optimizado |
|---------|--------|-------------------|
| Tras `insertar` | `invalidarReporte()` → O(M + n) | Append O(1), `reporteOrdenado = false` |
| Tras `eliminar` | `desenganchar` O(n) + invalidar O(M + n) | Desenganchar O(1), ordenado puede seguir true |
| Segunda llamada a `generarReporte` sin cambios | Inorden + merge otra vez | O(1) si `reporteOrdenado` |
| Lista reporte | Solo `siguiente` | `siguiente` + `anterior` + puntero `cola` en banco |

---

## Mejora alternativa (fase 2, opcional)

Fusión **k-vías** de listas ya ordenadas por balde (inorden por RBT) en lugar de merge global sobre lista desordenada: **O(n log B)** con B baldés no vacíos, B ≤ M (M fijo → buena constante). Requiere validar con el docente si reemplaza o complementa `mergeSortLista` global.

---

## Pendiente / validar con docente

- ¿Se permite **`anterior`** en `NodoHibrido` además de `siguiente`?
- ¿Sigue siendo obligatorio **inorden por balde** en cada generación o basta lista armada por inserts + merge?
- Actualizar simulador (`docs/simulador/`) y [diagrama-clases.md](diagrama-clases.md) al implementar.

---

## Archivos a modificar (implementación futura)

- `src/datos/NodoHibrido.java` — puntero `anterior` (canal reporte).
- `src/datos/BancoEstructura.java` — `colaReporte`, `reporteOrdenado`, lógica insert / eliminar / generar.
- `src/datos/interno/ReporteLista.java` — merge y desenganchar con doble enlace; menos `limpiarEnlaces` global.
- `README.md` — enlace a este documento.

---

*Referencia de diseño acordado en revisión de complejidad (cola + doble enlace + bandera de orden).*
