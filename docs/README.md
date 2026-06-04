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

Animaciones paso a paso alineadas con `src/datos/`. Desde la carpeta `simulador/`:

```bash
cd docs/simulador
python3 -m http.server 8080
```

Abre **http://localhost:8080** → `index.html` es la portada.

Páginas: simulador completo (hash + reporte), mapa de funciones, árbol R-N aislado, **ordenamiento** (solo MergeSort con cuentas de prueba).

---

## Diagrama de clases

Abre [`diagrama-clases.md`](diagrama-clases.md) en GitHub o en el IDE (vista previa Mermaid).

Incluye la API actual de Kevin (`datos/`, `datos/interno/`) y las clases futuras de Fernando, Leandro y Luna (`presentacion`, `negocio`).

---

## Por qué una sola carpeta `docs/`

Antes el diagrama estaba en `src/doc/` (mezclado con código) y la web en `documentacion/` (otro nombre). Ahora:

- **`src/`** = solo Java ejecutable  
- **`docs/`** = todo lo demás para leer y practicar
