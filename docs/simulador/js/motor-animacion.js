/**
 * Genera secuencias de pasos para animación (insertar, buscar, RBT, reporte, flujo API).
 */
(function (global) {
  "use strict";

  const BD = () => global.BancoDoc;
  const BS = () => global.BancoSerial;

  class RegistroPasos {
    constructor(tamano) {
      this.tamano = tamano;
      this.pasos = [];
    }

    capturar(casilleros, opts) {
      const o = opts || {};
      this.pasos.push({
        titulo: o.titulo || "",
        decision: o.decision || "",
        detalle: o.detalle || "",
        tipo: o.tipo || "default",
        hashIdx: o.hashIdx ?? o.balde ?? -1,
        balde: o.balde ?? o.hashIdx ?? 0,
        resaltar: o.resaltar || [],
        cursor: o.cursor ?? null,
        pivot: o.pivot ?? null,
        puntero: o.puntero ?? null,
        punteroPadre: o.punteroPadre ?? null,
        punteroLabel: o.punteroLabel || null,
        punteroDir: o.punteroDir || null,
        punteroEsNulo: !!o.punteroEsNulo,
        busqueda: o.busqueda ?? null,
        listaPunteros: o.listaPunteros || null,
        casilleros: BS().serializarCasillerosSync(casilleros),
        listaIds: o.listaIds || null,
        mergeArbol: o.mergeArbol || null,
        funcion: o.funcion || null,
      });
    }
  }

  const MV = () => global.BancoMergeViz;

  /** Metadatos de puntero para el canvas (variable actual, clave buscada, siguiente hijo). */
  function ptr(nodo, clave, dir, label, extra) {
    const o = {
      punteroLabel: label || "actual",
      busqueda: clave != null ? Number(clave) : null,
      punteroDir: dir || null,
    };
    if (nodo) o.puntero = nodo.getCuenta();
    else if (nodo === null) o.punteroEsNulo = true;
    return Object.assign(o, extra || {});
  }

  function obtenerRaiz(nodo) {
    let a = nodo;
    while (a && a.padre) a = a.padre;
    return a;
  }

  function obtenerRaizDesde(n) {
    if (!n) return null;
    return obtenerRaiz(n);
  }

  function buscarNodoAnim(raiz, cuenta, reg, cas, balde) {
    let actual = raiz;
    reg.capturar(cas, Object.assign(
      {
        titulo: "Buscar nodo a eliminar",
        decision: "Recorrido BST",
        detalle: `Localizar cuenta ${cuenta} antes de borrar.`,
        tipo: "buscar",
        balde,
      },
      ptr(actual, cuenta)
    ));
    while (actual) {
      if (cuenta === actual.getCuenta()) {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Nodo encontrado",
            decision: "Proceder a eliminar",
            tipo: "buscar",
            balde,
            resaltar: [cuenta],
          },
          ptr(actual, cuenta)
        ));
        return actual;
      }
      if (cuenta < actual.getCuenta()) {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Bajar a la izquierda",
            decision: `${cuenta} < ${actual.getCuenta()}`,
            tipo: "comparar",
            balde,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, cuenta, "izq")
        ));
        actual = actual.izquierdo;
      } else {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Bajar a la derecha",
            decision: `${cuenta} > ${actual.getCuenta()}`,
            tipo: "comparar",
            balde,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, cuenta, "der")
        ));
        actual = actual.derecho;
      }
    }
    return null;
  }

  function insertarEnArbolAnim(raiz, nuevo, reg, cas, balde) {
    let actual = raiz;
    let padre = null;
    while (actual) {
      padre = actual;
      if (nuevo.getCuenta() < actual.getCuenta()) {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Bajar por el árbol (BST)",
            decision: `${nuevo.getCuenta()} < ${actual.getCuenta()} → IZQUIERDA`,
            detalle: `Comparando con nodo ${actual.getCuenta()}. El puntero actual baja por izquierdo.`,
            tipo: "comparar",
            balde,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, nuevo.getCuenta(), "izq")
        ));
        actual = actual.izquierdo;
      } else {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Bajar por el árbol (BST)",
            decision: `${nuevo.getCuenta()} ≥ ${actual.getCuenta()} → DERECHA`,
            detalle: `Comparando con nodo ${actual.getCuenta()}. El puntero actual baja por derecho.`,
            tipo: "comparar",
            balde,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, nuevo.getCuenta(), "der")
        ));
        actual = actual.derecho;
      }
    }
    nuevo.padre = padre;
    if (nuevo.getCuenta() < padre.getCuenta()) {
      padre.izquierdo = nuevo;
      reg.capturar(cas, Object.assign(
        {
          titulo: "Enlazar nodo nuevo",
          decision: `Insertar como hijo IZQUIERDO de ${padre.getCuenta()}`,
          detalle: "Todo nodo nuevo entra ROJO (regla RBT). Luego se ejecutará corregirInsercion().",
          tipo: "insertar",
          balde,
          resaltar: [nuevo.getCuenta(), padre.getCuenta()],
        },
        ptr(nuevo, nuevo.getCuenta(), null, "nuevo"),
        { punteroPadre: padre.getCuenta() }
      ));
    } else {
      padre.derecho = nuevo;
      reg.capturar(cas, Object.assign(
        {
          titulo: "Enlazar nodo nuevo",
          decision: `Insertar como hijo DERECHO de ${padre.getCuenta()}`,
          detalle: "Nodo nuevo ROJO enlazado. Preparando balanceo…",
          tipo: "insertar",
          balde,
          resaltar: [nuevo.getCuenta(), padre.getCuenta()],
        },
        ptr(nuevo, nuevo.getCuenta(), null, "nuevo"),
        { punteroPadre: padre.getCuenta() }
      ));
    }
  }

  function rotarIzquierdaAnim(nodo, reg, cas, balde) {
    const pivot = nodo.derecho;
    reg.capturar(cas, {
      titulo: "Rotación izquierda",
      decision: `rotarIzquierda(${nodo.getCuenta()})`,
      detalle: `El hijo derecho ${pivot.getCuenta()} sube; ${nodo.getCuenta()} pasa a ser su hijo izquierdo.`,
      tipo: "rotar",
      balde,
      resaltar: [nodo.getCuenta(), pivot.getCuenta()],
      pivot: pivot.getCuenta(),
    });
    nodo.derecho = pivot.izquierdo;
    if (pivot.izquierdo) pivot.izquierdo.padre = nodo;
    pivot.padre = nodo.padre;
    if (nodo.padre) {
      if (nodo === nodo.padre.izquierdo) nodo.padre.izquierdo = pivot;
      else nodo.padre.derecho = pivot;
    }
    pivot.izquierdo = nodo;
    nodo.padre = pivot;
    reg.capturar(cas, {
      titulo: "Rotación completada",
      decision: "Estructura actualizada tras rotarIzquierda",
      tipo: "rotar",
      balde,
      resaltar: [pivot.getCuenta(), nodo.getCuenta()],
    });
  }

  function rotarDerechaAnim(nodo, reg, cas, balde) {
    const pivot = nodo.izquierdo;
    reg.capturar(cas, {
      titulo: "Rotación derecha",
      decision: `rotarDerecha(${nodo.getCuenta()})`,
      detalle: `El hijo izquierdo ${pivot.getCuenta()} sube; ${nodo.getCuenta()} pasa a ser su hijo derecho.`,
      tipo: "rotar",
      balde,
      resaltar: [nodo.getCuenta(), pivot.getCuenta()],
      pivot: pivot.getCuenta(),
    });
    nodo.izquierdo = pivot.derecho;
    if (pivot.derecho) pivot.derecho.padre = nodo;
    pivot.padre = nodo.padre;
    if (nodo.padre) {
      if (nodo === nodo.padre.izquierdo) nodo.padre.izquierdo = pivot;
      else nodo.padre.derecho = pivot;
    }
    pivot.derecho = nodo;
    nodo.padre = pivot;
    reg.capturar(cas, {
      titulo: "Rotación completada",
      decision: "Estructura actualizada tras rotarDerecha",
      tipo: "rotar",
      balde,
      resaltar: [pivot.getCuenta(), nodo.getCuenta()],
    });
  }

  function corregirInsercionAnim(nodo, reg, cas, balde) {
    let actual = nodo;
    if (!actual.padre || !actual.padre.esRojo) {
      reg.capturar(cas, Object.assign(
        {
          titulo: "Inserción — Caso 2: padre negro",
          decision: "No hay dos rojos seguidos",
          detalle: `El padre ${actual.padre ? actual.padre.getCuenta() : "(raíz)"} es negro o no existe. corregirInsercion() termina sin cambios.`,
          tipo: "fin",
          balde,
          resaltar: [actual.getCuenta()],
        },
        ptr(actual, actual.getCuenta(), null, "actual")
      ));
      return;
    }

    reg.capturar(cas, Object.assign(
      {
        titulo: "corregirInsercion()",
        decision: "Violación: padre rojo → revisar tío y abuelo",
        detalle: "Casos 3 (tío rojo), 4 (triángulo) o 5 (línea) según la configuración.",
        tipo: "balanceo",
        balde,
        resaltar: [actual.getCuenta()],
      },
      ptr(actual, actual.getCuenta(), null, "actual")
    ));

    while (actual.padre && actual.padre.esRojo) {
      let padre = actual.padre;
      let abuelo = padre.padre;
      if (!abuelo) break;

      if (padre === abuelo.izquierdo) {
        const tio = abuelo.derecho;
        if (tio && tio.esRojo) {
          reg.capturar(cas, {
            titulo: "Inserción — Caso 3: tío rojo",
            decision: "Recolorar padre, tío y abuelo",
            detalle: `P ${padre.getCuenta()} y T ${tio.getCuenta()} → NEGRO; abuelo A ${abuelo.getCuenta()} → ROJO. El problema sube a A.`,
            tipo: "recolorar",
            balde,
            resaltar: [padre.getCuenta(), tio.getCuenta(), abuelo.getCuenta()],
          });
          padre.esRojo = false;
          tio.esRojo = false;
          abuelo.esRojo = true;
          actual = abuelo;
          reg.capturar(cas, { titulo: "Tras recolorar", decision: "Continuar desde el abuelo", tipo: "recolorar", balde, resaltar: [abuelo.getCuenta()] });
        } else {
          if (actual === padre.derecho) {
            reg.capturar(cas, {
              titulo: "Inserción — Caso 4: triángulo (Zig-Zag)",
              decision: "Rotación izquierda en el padre P",
              detalle: `N y P forman triángulo; rotarIzquierda(${padre.getCuenta()}) para alinear y pasar al Caso 5.`,
              tipo: "balanceo",
              balde,
              resaltar: [actual.getCuenta(), padre.getCuenta()],
            });
            actual = padre;
            rotarIzquierdaAnim(actual, reg, cas, balde);
            padre = actual.padre;
            abuelo = padre ? padre.padre : null;
          }
          if (padre && abuelo) {
            reg.capturar(cas, {
              titulo: "Inserción — Caso 5: línea (Zig-Zig)",
              decision: "Rotación derecha en el abuelo A + recolorar",
              detalle: `P ${padre.getCuenta()} → NEGRO; A ${abuelo.getCuenta()} → ROJO; rotarDerecha(A). Balanceo local terminado.`,
              tipo: "balanceo",
              balde,
              resaltar: [padre.getCuenta(), abuelo.getCuenta()],
            });
            padre.esRojo = false;
            abuelo.esRojo = true;
            rotarDerechaAnim(abuelo, reg, cas, balde);
          }
        }
      } else {
        const tio = abuelo.izquierdo;
        if (tio && tio.esRojo) {
          reg.capturar(cas, {
            titulo: "Inserción — Caso 3 (espejo): tío rojo",
            decision: "Recolorar padre, tío y abuelo",
            detalle: "Misma lógica del Caso 3 en el subárbol derecho del abuelo.",
            tipo: "recolorar",
            balde,
            resaltar: [padre.getCuenta(), tio.getCuenta(), abuelo.getCuenta()],
          });
          padre.esRojo = false;
          tio.esRojo = false;
          abuelo.esRojo = true;
          actual = abuelo;
        } else {
          if (actual === padre.izquierdo) {
            reg.capturar(cas, {
              titulo: "Inserción — Caso 4 (espejo): triángulo (Zig-Zag)",
              decision: "Rotación derecha en el padre P",
              detalle: `rotarDerecha(${padre.getCuenta()}) para alinear antes del Caso 5.`,
              tipo: "balanceo",
              balde,
              resaltar: [actual.getCuenta(), padre.getCuenta()],
            });
            actual = padre;
            rotarDerechaAnim(actual, reg, cas, balde);
            padre = actual.padre;
            abuelo = padre ? padre.padre : null;
          }
          if (padre && abuelo) {
            reg.capturar(cas, {
              titulo: "Inserción — Caso 5 (espejo): línea (Zig-Zig)",
              decision: "Rotación izquierda en el abuelo A + recolorar",
              detalle: `P → NEGRO, A → ROJO; rotarIzquierda(A).`,
              tipo: "balanceo",
              balde,
              resaltar: [padre.getCuenta(), abuelo.getCuenta()],
            });
            padre.esRojo = false;
            abuelo.esRojo = true;
            rotarIzquierdaAnim(abuelo, reg, cas, balde);
          }
        }
      }
    }
  }

  function insertarRBTAnim(raiz, nuevo, reg, cas, balde) {
    nuevo.siguiente = null;
    if (!raiz) {
      nuevo.esRojo = false;
      reg.capturar(cas, {
        titulo: "Inserción — Caso 1: árbol vacío",
        decision: "Insertar primera clave en el árbol",
        detalle: "Este casillero no tiene nodos todavía.",
        tipo: "insertar",
        balde,
        busqueda: nuevo.getCuenta(),
        punteroEsNulo: true,
        punteroLabel: "posición",
      });
      cas[balde] = nuevo;
      reg.capturar(cas, {
        titulo: "Inserción — Caso 1: raíz negra",
        decision: "N es raíz → pintar NEGRO",
        detalle: "Regla de la raíz: sin corregirInsercion adicional.",
        tipo: "insertar",
        balde,
        resaltar: [nuevo.getCuenta()],
        puntero: nuevo.getCuenta(),
        punteroLabel: "raíz",
      });
      return nuevo;
    }
    insertarEnArbolAnim(raiz, nuevo, reg, cas, balde);
    corregirInsercionAnim(nuevo, reg, cas, balde);
    const nuevaRaiz = obtenerRaiz(nuevo);
    if (nuevaRaiz) {
      nuevaRaiz.esRojo = false;
      cas[balde] = nuevaRaiz;
      reg.capturar(cas, {
        titulo: "Regla final",
        decision: "Raíz siempre NEGRA",
        detalle: "obtenerRaiz() y forzar esRojo = false en la raíz.",
        tipo: "fin",
        balde,
        resaltar: [nuevaRaiz.getCuenta()],
      });
    }
    return nuevaRaiz;
  }

  function esRojoONulo(n) {
    return !n || n.esRojo;
  }

  function minimoArbol(n) {
    let a = n;
    while (a.izquierdo) a = a.izquierdo;
    return a;
  }

  function intercambiarDatosAnim(a, b) {
    const t = a.datos;
    a.datos = b.datos;
    b.datos = t;
  }

  function desengancharNodoAnim(n) {
    if (!n.padre) return;
    if (n === n.padre.izquierdo) n.padre.izquierdo = null;
    else n.padre.derecho = null;
    n.padre = null;
  }

  function reemplazarNodoAnim(objetivo, reemplazo) {
    if (objetivo.padre) {
      if (objetivo === objetivo.padre.izquierdo) objetivo.padre.izquierdo = reemplazo;
      else objetivo.padre.derecho = reemplazo;
    }
    if (reemplazo) reemplazo.padre = objetivo.padre;
    desengancharNodoAnim(objetivo);
  }

  function corregirEliminacionAnim(nodo, reg, cas, balde) {
    let actual = nodo;
    reg.capturar(cas, Object.assign(
      {
        titulo: "corregirEliminacion()",
        decision: "Déficit de negro tras borrar",
        detalle: "Mientras el nodo actual sea negro (o null) y no sea la raíz, se ajusta con el hermano.",
        tipo: "balanceo",
        balde,
      },
      ptr(actual, actual ? actual.getCuenta() : null, null, "actual")
    ));

    while ((actual == null || !actual.esRojo) && actual !== obtenerRaizDesde(actual)) {
      const padre = actual != null ? actual.padre : null;
      if (!padre) break;

      if (actual === padre.izquierdo) {
        let hermano = padre.derecho;
        if (hermano && hermano.esRojo) {
          reg.capturar(cas, {
            titulo: "Eliminación — Caso 2: hermano rojo",
            decision: "Rotar padre hacia V + recolorear",
            detalle: `H ${hermano.getCuenta()} → NEGRO, padre → ROJO; rotarIzquierda(padre). El doble negro sigue; cae en casos 3–6.`,
            tipo: "balanceo",
            balde,
            resaltar: [padre.getCuenta(), hermano.getCuenta()],
            pivot: padre.getCuenta(),
          });
          hermano.esRojo = false;
          padre.esRojo = true;
          rotarIzquierdaAnim(padre, reg, cas, balde);
          hermano = padre.derecho;
        }

        if (
          hermano &&
          !esRojoONulo(hermano.izquierdo) &&
          !esRojoONulo(hermano.derecho)
        ) {
          if (padre.esRojo) {
            reg.capturar(cas, {
              titulo: "Eliminación — Caso 4: sobrinos negros, padre rojo",
              decision: "H → rojo; padre absorbe el doble negro",
              detalle: `H ${hermano.getCuenta()} rojo; el padre ${padre.getCuenta()} pasa a negro al cerrar. Termina el arreglo.`,
              tipo: "recolorar",
              balde,
              resaltar: [hermano.getCuenta(), padre.getCuenta()],
            });
          } else {
            reg.capturar(cas, {
              titulo: "Eliminación — Caso 3: sobrinos negros, padre negro",
              decision: "H → rojo; subir doble negro al padre",
              detalle: `Ambos sobrinos de H ${hermano.getCuenta()} negros; el déficit sube al padre ${padre.getCuenta()}.`,
              tipo: "recolorar",
              balde,
              resaltar: [hermano.getCuenta(), padre.getCuenta()],
            });
          }
          hermano.esRojo = true;
          actual = padre;
        } else if (hermano) {
          if (!esRojoONulo(hermano.derecho)) {
            reg.capturar(cas, {
              titulo: "Eliminación — Caso 5: triángulo (sobrino cercano rojo)",
              decision: "Rotar hermano H + recolorear",
              detalle: "Sobrino lejano negro, cercano rojo → rotarDerecha(H) y caer en Caso 6.",
              tipo: "balanceo",
              balde,
              resaltar: [hermano.getCuenta()],
            });
            if (hermano.izquierdo) hermano.izquierdo.esRojo = false;
            hermano.esRojo = true;
            rotarDerechaAnim(hermano, reg, cas, balde);
            hermano = padre.derecho;
          }
          reg.capturar(cas, {
            titulo: "Eliminación — Caso 6: sobrino lejano rojo",
            decision: "Rotar padre hacia V + colores finales",
            detalle: `H hereda color del padre; padre y sobrino lejano → NEGRO; rotarIzquierda(padre). Doble negro disuelto.`,
            tipo: "balanceo",
            balde,
            resaltar: [padre.getCuenta(), hermano.getCuenta()],
            pivot: padre.getCuenta(),
          });
          hermano.esRojo = padre.esRojo;
          padre.esRojo = false;
          if (hermano.derecho) hermano.derecho.esRojo = false;
          rotarIzquierdaAnim(padre, reg, cas, balde);
          actual = obtenerRaiz(actual);
        }
      } else {
        let hermano = padre.izquierdo;
        if (hermano && hermano.esRojo) {
          reg.capturar(cas, {
            titulo: "Eliminación — Caso 2 (espejo): hermano rojo",
            decision: "Rotar padre hacia V + recolorear",
            detalle: "Misma lógica del Caso 2 en el subárbol derecho del padre.",
            tipo: "balanceo",
            balde,
            resaltar: [padre.getCuenta(), hermano.getCuenta()],
            pivot: padre.getCuenta(),
          });
          hermano.esRojo = false;
          padre.esRojo = true;
          rotarDerechaAnim(padre, reg, cas, balde);
          hermano = padre.izquierdo;
        }

        if (
          hermano &&
          !esRojoONulo(hermano.derecho) &&
          !esRojoONulo(hermano.izquierdo)
        ) {
          if (padre.esRojo) {
            reg.capturar(cas, {
              titulo: "Eliminación — Caso 4 (espejo): padre rojo",
              decision: "H → rojo; padre absorbe el doble negro",
              tipo: "recolorar",
              balde,
              resaltar: [hermano.getCuenta(), padre.getCuenta()],
            });
          } else {
            reg.capturar(cas, {
              titulo: "Eliminación — Caso 3 (espejo): padre negro",
              decision: "H → rojo; subir doble negro",
              tipo: "recolorar",
              balde,
              resaltar: [hermano.getCuenta(), padre.getCuenta()],
            });
          }
          hermano.esRojo = true;
          actual = padre;
        } else if (hermano) {
          if (!esRojoONulo(hermano.izquierdo)) {
            reg.capturar(cas, {
              titulo: "Eliminación — Caso 5 (espejo): triángulo",
              decision: "Rotar hermano H + recolorear",
              tipo: "balanceo",
              balde,
              resaltar: [hermano.getCuenta()],
            });
            if (hermano.derecho) hermano.derecho.esRojo = false;
            hermano.esRojo = true;
            rotarIzquierdaAnim(hermano, reg, cas, balde);
            hermano = padre.izquierdo;
          }
          reg.capturar(cas, {
            titulo: "Eliminación — Caso 6 (espejo): sobrino lejano rojo",
            decision: "Rotar padre hacia V + colores finales",
            tipo: "balanceo",
            balde,
            resaltar: [padre.getCuenta(), hermano.getCuenta()],
            pivot: padre.getCuenta(),
          });
          hermano.esRojo = padre.esRojo;
          padre.esRojo = false;
          if (hermano.izquierdo) hermano.izquierdo.esRojo = false;
          rotarDerechaAnim(padre, reg, cas, balde);
          actual = obtenerRaiz(actual);
        }
      }
    }

    if (actual && !actual.padre) {
      reg.capturar(cas, {
        titulo: "Eliminación — Caso 1: doble negro en la raíz",
        decision: "Quitar el negro extra en la cima",
        detalle: "El déficit llegó a la raíz; el nodo se deja negro normal y el árbol queda balanceado.",
        tipo: "fin",
        balde,
        resaltar: [actual.getCuenta()],
      });
    }

    if (actual) {
      actual.esRojo = false;
      reg.capturar(cas, {
        titulo: "Eliminar: cerrar corrección",
        decision: "Nodo actual → negro",
        tipo: "fin",
        balde,
        resaltar: [actual.getCuenta()],
      });
    }
  }

  function eliminarRBTAnim(raiz, cuenta, reg, cas, balde) {
    const objetivo = buscarNodoAnim(raiz, cuenta, reg, cas, balde);
    if (!objetivo) {
      reg.capturar(cas, {
        titulo: "Eliminar: no encontrado",
        decision: "La cuenta no está en el árbol",
        tipo: "error",
        balde,
        busqueda: cuenta,
        punteroEsNulo: true,
      });
      return raiz;
    }

    reg.capturar(cas, Object.assign(
      {
        titulo: "Nodo objetivo localizado",
        decision: `Eliminar cuenta ${cuenta}`,
        detalle: "ArbolRojoNegro.eliminar — mismo flujo que en Java.",
        tipo: "eliminar",
        balde,
        resaltar: [cuenta],
      },
      ptr(objetivo, cuenta)
    ));

    if (objetivo.izquierdo && objetivo.derecho) {
      const sucesor = minimoArbol(objetivo.derecho);
      reg.capturar(cas, {
        titulo: "Dos hijos → sucesor",
        decision: "intercambiarDatos con mínimo del subárbol derecho",
        detalle: `Sucesor: ${sucesor.getCuenta()}. Los punteros del árbol no se mueven, solo los datos.`,
        tipo: "eliminar",
        balde,
        resaltar: [objetivo.getCuenta(), sucesor.getCuenta()],
        puntero: sucesor.getCuenta(),
      });
      intercambiarDatosAnim(objetivo, sucesor);
      objetivo = sucesor;
    }

    const hijo = objetivo.izquierdo || objetivo.derecho;
    const eraRojo = objetivo.esRojo;
    const eraRaiz = !objetivo.padre;

    if (hijo) {
      reg.capturar(cas, {
        titulo: "Reemplazar por hijo único",
        decision: eraRojo ? "Hijo sube (sin déficit)" : "Hijo sube → corregirEliminacion",
        detalle: `Sustituir nodo ${objetivo.getCuenta()} por su hijo ${hijo.getCuenta()}.`,
        tipo: "eliminar",
        balde,
        resaltar: [objetivo.getCuenta(), hijo.getCuenta()],
      });
      reemplazarNodoAnim(objetivo, hijo);
      if (!eraRojo) corregirEliminacionAnim(hijo, reg, cas, balde);
      const nuevaRaiz = eraRaiz ? obtenerRaiz(hijo) : obtenerRaiz(raiz);
      cas[balde] = nuevaRaiz;
      reg.capturar(cas, {
        titulo: "Eliminación completada",
        decision: "Árbol actualizado",
        tipo: "fin",
        balde,
      });
      return nuevaRaiz;
    }

    if (eraRaiz) {
      reg.capturar(cas, {
        titulo: "Eliminar raíz hoja",
        decision: "Árbol queda vacío",
        tipo: "fin",
        balde,
      });
      cas[balde] = null;
      return null;
    }

    if (!eraRojo) {
      corregirEliminacionAnim(objetivo, reg, cas, balde);
    }
    reg.capturar(cas, {
      titulo: "Desenganchar hoja",
      decision: "Quitar nodo del árbol",
      detalle: `Nodo ${objetivo.getCuenta()} desenlazado de su padre.`,
      tipo: "eliminar",
      balde,
      resaltar: [objetivo.getCuenta()],
    });
    desengancharNodoAnim(objetivo);
    cas[balde] = obtenerRaiz(raiz);
    reg.capturar(cas, {
      titulo: "Eliminación completada",
      decision: "corregirEliminacion finalizado",
      tipo: "fin",
      balde,
    });
    return cas[balde];
  }

  function animarSoloEliminarRBT(secuenciaInsertar, cuentaEliminar) {
    const cas = [null];
    const reg = new RegistroPasos(1);
    const balde = 0;
    const { Cliente, NodoHibrido } = BD();

    reg.capturar(cas, {
      titulo: "Fase eliminación",
      decision: "Construir árbol e insertar valores",
      detalle: `Luego se eliminará la cuenta ${cuentaEliminar}.`,
      tipo: "inicio",
      balde: 0,
    });

    secuenciaInsertar.forEach((cuenta) => {
      reg.capturar(cas, {
        titulo: `Insertar ${cuenta} (preparar árbol)`,
        decision: `Paso de construcción`,
        tipo: "insertar",
        balde: 0,
        cursor: cuenta,
      });
      const nuevo = new NodoHibrido(new Cliente(cuenta, "N" + cuenta, "Demo", 0));
      cas[0] = insertarRBTAnim(cas[0], nuevo, reg, cas, balde);
    });

    reg.capturar(cas, {
      titulo: "Eliminar cuenta",
      decision: `ArbolRojoNegro.eliminar(${cuentaEliminar})`,
      detalle: "A partir de aquí: búsqueda, sucesor si aplica y corregirEliminacion.",
      tipo: "eliminar",
      balde: 0,
      busqueda: cuentaEliminar,
    });

    cas[0] = eliminarRBTAnim(cas[0], cuentaEliminar, reg, cas, balde);

    return { pasos: reg.pasos, casilleros: BS().sincronizarRaices(cas) };
  }

  function animarInsertar(casillerosOrig, tamano, cliente) {
    const cas = BS().clonarCasilleros(casillerosOrig);
    const reg = new RegistroPasos(tamano);
    const cuenta = cliente.cuenta;
    const idx = BD().calcularIndice(cuenta, tamano);

    reg.capturar(cas, {
      titulo: "Inicio: BancoEstructura.insertar",
      decision: "Estado inicial del banco",
      detalle: "Antes de modificar la tabla hash.",
      tipo: "inicio",
      hashIdx: -1,
      balde: 0,
    });

    reg.capturar(cas, {
      titulo: "TablaHash.calcularIndice",
      decision: `${cuenta} % ${tamano} = ${idx}`,
      detalle: `El cliente irá al casillero [${idx}]. Todos los nodos de ese balde comparten un árbol RBT.`,
      tipo: "hash",
      hashIdx: idx,
      balde: idx,
      cursor: cuenta,
    });

    let raiz = cas[idx];
    let actual = raiz;
    reg.capturar(cas, Object.assign(
      {
        titulo: "ArbolRojoNegro.buscar",
        decision: "¿La cuenta ya existe en este balde?",
        detalle: "Recorrido BST: puntero actual recorre el árbol.",
        tipo: "buscar",
        hashIdx: idx,
        balde: idx,
      },
      ptr(actual, cuenta)
    ));

    while (actual) {
      if (cuenta === actual.getCuenta()) {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Duplicado",
            decision: "return false — cuenta ya registrada",
            detalle: `Encontrado nodo ${cuenta}. No se inserta.`,
            tipo: "error",
            hashIdx: idx,
            balde: idx,
            resaltar: [cuenta],
          },
          ptr(actual, cuenta)
        ));
        return { pasos: reg.pasos, ok: false, casilleros: cas };
      }
      if (cuenta < actual.getCuenta()) {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Búsqueda de duplicado",
            decision: `${cuenta} < ${actual.getCuenta()} → izquierda`,
            tipo: "buscar",
            balde: idx,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, cuenta, "izq")
        ));
        actual = actual.izquierdo;
      } else {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Búsqueda de duplicado",
            decision: `${cuenta} > ${actual.getCuenta()} → derecha`,
            tipo: "buscar",
            balde: idx,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, cuenta, "der")
        ));
        actual = actual.derecho;
      }
    }

    reg.capturar(cas, Object.assign(
      {
        titulo: "Sin duplicado",
        decision: "Crear NodoHibrido y ArbolRojoNegro.insertar",
        detalle: "actual llegó a ∅ — posición libre para insertar.",
        tipo: "insertar",
        balde: idx,
        busqueda: cuenta,
        punteroEsNulo: true,
        punteroLabel: "actual",
      }
    ));

    const { Cliente, NodoHibrido } = BD();
    const nuevo = new NodoHibrido(new Cliente(cliente.cuenta, cliente.nombre, cliente.tipo, cliente.saldo));
    cas[idx] = insertarRBTAnim(raiz, nuevo, reg, cas, idx);

    reg.capturar(cas, {
      titulo: "TablaHash.setRaizPorCuenta",
      decision: `Actualizar casilleros[${idx}]`,
      detalle: "invalidarReporte() limpia punteros siguiente si había reporte.",
      tipo: "fin",
      hashIdx: idx,
      balde: idx,
      funcion: "BancoEstructura.insertar",
    });

    return { pasos: reg.pasos, ok: true, casilleros: BS().sincronizarRaices(cas) };
  }

  function animarBuscar(casillerosOrig, tamano, cuenta) {
    const cas = BS().clonarCasilleros(casillerosOrig);
    const reg = new RegistroPasos(tamano);
    const idx = BD().calcularIndice(cuenta, tamano);

    reg.capturar(cas, {
      titulo: "BancoEstructura.buscar",
      decision: `Índice hash = ${idx}`,
      tipo: "hash",
      hashIdx: idx,
      balde: idx,
      cursor: cuenta,
    });

    let actual = cas[idx];
    if (!actual) {
      reg.capturar(cas, {
        titulo: "Balde vacío",
        decision: "return null",
        detalle: `No hay árbol en casilleros[${idx}].`,
        tipo: "error",
        balde: idx,
      });
      return { pasos: reg.pasos, encontrado: null, casilleros: cas };
    }

    reg.capturar(cas, Object.assign(
      {
        titulo: "Inicio recorrido BST",
        decision: "actual = raíz del balde",
        tipo: "buscar",
        balde: idx,
      },
      ptr(actual, cuenta)
    ));

    while (actual) {
      if (cuenta === actual.getCuenta()) {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Encontrado",
            decision: "return nodo.getDatos()",
            detalle: `Cliente: ${actual.datos.nombre}`,
            tipo: "fin",
            balde: idx,
            resaltar: [cuenta],
          },
          ptr(actual, cuenta)
        ));
        return { pasos: reg.pasos, encontrado: actual, casilleros: cas };
      }
      if (cuenta < actual.getCuenta()) {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Comparar",
            decision: `${cuenta} < ${actual.getCuenta()} → IZQUIERDA`,
            tipo: "comparar",
            balde: idx,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, cuenta, "izq")
        ));
        actual = actual.izquierdo;
      } else {
        reg.capturar(cas, Object.assign(
          {
            titulo: "Comparar",
            decision: `${cuenta} > ${actual.getCuenta()} → DERECHA`,
            tipo: "comparar",
            balde: idx,
            resaltar: [actual.getCuenta()],
          },
          ptr(actual, cuenta, "der")
        ));
        actual = actual.derecho;
      }
    }

    reg.capturar(cas, Object.assign(
      {
        titulo: "No encontrado",
        decision: "return null",
        tipo: "error",
        balde: idx,
        busqueda: cuenta,
        punteroEsNulo: true,
        punteroLabel: "actual",
      }
    ));
    return { pasos: reg.pasos, encontrado: null, casilleros: cas };
  }

  function animarSoloRBT(secuenciaCuentas) {
    const cas = [null];
    const reg = new RegistroPasos(1);
    const balde = 0;

    reg.capturar(cas, {
      titulo: "Árbol rojo-negro aislado",
      decision: "Sin tabla hash — un solo balde",
      detalle: "Misma lógica que ArbolRojoNegro.java",
      tipo: "inicio",
      balde: 0,
    });

    secuenciaCuentas.forEach((cuenta, i) => {
      reg.capturar(cas, {
        titulo: `Insertar valor ${cuenta}`,
        decision: `Paso ${i + 1} de ${secuenciaCuentas.length}`,
        tipo: "insertar",
        balde: 0,
        cursor: cuenta,
      });
      const { Cliente, NodoHibrido } = BD();
      const nuevo = new NodoHibrido(new Cliente(cuenta, "N" + cuenta, "Demo", 0));
      cas[0] = insertarRBTAnim(cas[0], nuevo, reg, cas, balde);
    });

    return { pasos: reg.pasos, casilleros: BS().sincronizarRaices(cas) };
  }

  function construirListaEnlazada(cuentas) {
    const { Cliente, NodoHibrido } = BD();
    let cabeza = null;
    let cola = null;
    cuentas.forEach((c) => {
      const n = new NodoHibrido(new Cliente(c, "C" + c, "Demo", 0));
      n.siguiente = null;
      if (!cabeza) cabeza = cola = n;
      else {
        cola.siguiente = n;
        cola = n;
      }
    });
    return cabeza;
  }

  /** Solo fase 2 del reporte: MergeSort sobre la lista en el orden que escribió el usuario. */
  function animarSoloMergeSort(cuentas) {
    if (!cuentas.length) return { pasos: [], listaIds: [], casilleros: new Array(7).fill(null) };
    const cas = new Array(7).fill(null);
    const reg = new RegistroPasos(7);
    const cabeza = construirListaEnlazada(cuentas);
    const idsIni = BS().serializarLista(cabeza);

    reg.capturar(cas, {
      titulo: "Lista inicial",
      decision: "Orden de entrada (sin ordenar)",
      detalle: `Encadenado solo con siguiente: ${idsIni.join(" → ")}`,
      tipo: "inicio",
      listaIds: idsIni,
    });

    let idGen = (() => {
      let n = 1;
      return () => n++;
    })();
    const arbolMerge = MV().crearNodoMerge(() => 0, idsIni);
    arbolMerge.estado = "raiz";
    mergeSortAnim(cabeza, reg, cas, arbolMerge, idGen, arbolMerge);
    const ult = reg.pasos[reg.pasos.length - 1];
    return { pasos: reg.pasos, listaIds: ult?.listaIds || idsIni, casilleros: cas };
  }

  function animarReporte(casillerosOrig, tamano) {
    const cas = BS().clonarCasilleros(casillerosOrig);
    const reg = new RegistroPasos(tamano);

    reg.capturar(cas, {
      titulo: "generarReporteOrdenado",
      decision: "ReporteLista.generarOrdenado",
      detalle: "Fase 1: encadenar con inorden. Fase 2: MergeSort por siguiente.",
      tipo: "inicio",
    });

    cas.forEach((r) => BD().limpiarSiguiente(r));
    reg.capturar(cas, {
      titulo: "limpiarEnlaces",
      decision: "siguiente = null en todo el bosque",
      tipo: "default",
    });

    let cabeza = null;
    let cola = null;
    for (let i = 0; i < cas.length; i++) {
      if (!cas[i]) continue;
      const antes = BS().serializarLista(cabeza);
      encadenarInordenAnim(cas[i], cas, i, reg, (n) => {
        n.siguiente = null;
        if (!cabeza) {
          cabeza = n;
          cola = n;
        } else {
          cola.siguiente = n;
          cola = n;
        }
        const ids = BS().serializarLista(cabeza);
        reg.capturar(cas, {
          titulo: "Inorden → siguiente",
          decision: `Balde [${i}]: encadenar ${n.getCuenta()}`,
          detalle: antes.length
            ? `Visita inorden; lista: ${antes.join(" → ")} → ${n.getCuenta()}`
            : `Visita inorden; primera cuenta: ${n.getCuenta()}`,
          tipo: "encadenar",
          listaIds: ids,
          resaltar: [n.getCuenta()],
          balde: i,
          hashIdx: i,
        });
      });
    }

    const idsIni = BS().serializarLista(cabeza);
    reg.capturar(cas, {
      titulo: "Antes de ordenar",
      decision: "Lista global (puede no estar ordenada)",
      detalle: idsIni.join(" → ") || "(vacía)",
      tipo: "default",
      listaIds: idsIni,
    });

    let idGen = (() => {
      let n = 1;
      return () => n++;
    })();
    const arbolMerge = MV().crearNodoMerge(() => 0, idsIni);
    arbolMerge.estado = "raiz";
    mergeSortAnim(cabeza, reg, cas, arbolMerge, idGen, arbolMerge);
    const idsFin = reg.pasos[reg.pasos.length - 1].listaIds;
    return { pasos: reg.pasos, listaIds: idsFin, casilleros: cas };
  }

  function encadenarInordenAnim(nodo, cas, balde, reg, onNodo) {
    if (!nodo) return;
    encadenarInordenAnim(nodo.izquierdo, cas, balde, reg, onNodo);
    onNodo(nodo);
    encadenarInordenAnim(nodo.derecho, cas, balde, reg, onNodo);
  }

  function mergeSortAnim(cabeza, reg, cas, nodoArbol, idGen, raizArbol) {
    const ids = BS().serializarLista(cabeza);
    nodoArbol.valores = ids;

    reg.capturar(cas, {
      titulo: "mergeSortLista",
      decision: ids.length <= 1 ? "Caso base (0 o 1 nodo)" : "Dividir y ordenar recursivamente",
      detalle: `Sublista: [${ids.join(", ")}]`,
      tipo: "merge",
      listaIds: ids,
      mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
    });

    if (!cabeza || !cabeza.siguiente) {
      nodoArbol.estado = "base";
      reg.capturar(cas, {
        titulo: "Caso base",
        decision: ids.length ? `Un elemento: ${ids[0]} — return` : "Lista vacía",
        tipo: "merge",
        listaIds: ids,
        mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
      });
      return cabeza;
    }

    nodoArbol.estado = "dividiendo";
    let lento = cabeza;
    let rapido = cabeza.siguiente;
    reg.capturar(cas, {
      titulo: "dividirLista",
      decision: "Tortuga y liebre: cortar puntero siguiente",
      detalle: `Lista: ${ids.join(" → ")}. lento y rápido avanzan por siguiente.`,
      tipo: "merge",
      listaIds: ids,
      listaPunteros: [
        { label: "lento", id: lento.getCuenta() },
        { label: "rápido", id: rapido ? rapido.getCuenta() : lento.getCuenta() },
      ],
      mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
    });

    while (rapido && rapido.siguiente) {
      lento = lento.siguiente;
      rapido = rapido.siguiente.siguiente;
    }
    const segunda = lento.siguiente;
    lento.siguiente = null;

    reg.capturar(cas, {
      titulo: "Corte de lista",
      decision: "lento.siguiente = null",
      detalle: `Mitad izq termina en ${lento.getCuenta()}; empieza sublista [${segunda ? segunda.getCuenta() : ""}…]`,
      tipo: "merge",
      listaIds: ids,
      listaPunteros: [
        { label: "lento", id: lento.getCuenta() },
        { label: "corte", id: lento.getCuenta() },
      ],
      mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
    });

    const izqIds = BS().serializarLista(cabeza);
    const derIds = BS().serializarLista(segunda);

    nodoArbol.izq = MV().crearNodoMerge(idGen, izqIds);
    nodoArbol.der = MV().crearNodoMerge(idGen, derIds);
    nodoArbol.estado = "dividido";

    reg.capturar(cas, {
      titulo: "Mitades separadas",
      decision: `Izquierda [${izqIds.join(", ")}] | Derecha [${derIds.join(", ")}]`,
      detalle: "lento.siguiente = null corta la lista",
      tipo: "merge",
      listaIds: ids,
      mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
    });

    const izq = mergeSortAnim(cabeza, reg, cas, nodoArbol.izq, idGen, raizArbol);
    const der = mergeSortAnim(segunda, reg, cas, nodoArbol.der, idGen, raizArbol);
    return fusionarAnim(izq, der, reg, cas, nodoArbol, raizArbol);
  }

  function fusionarAnim(a, b, reg, cas, nodoArbol, raizArbol) {
    const { Cliente, NodoHibrido } = BD();
    const dummy = new NodoHibrido(new Cliente(0, "_", "_", 0));
    let act = dummy;
    const tomados = [];

    const idsA = BS().serializarLista(a);
    const idsB = BS().serializarLista(b);
    nodoArbol.estado = "fusion";
    nodoArbol.resaltar = [];

    reg.capturar(cas, {
      titulo: "fusionarListas",
      decision: "Comparar cabezas de A y B",
      detalle: `A: [${idsA.join(", ")}]  B: [${idsB.join(", ")}]`,
      tipo: "merge",
      listaIds: idsA.concat(idsB),
      mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
    });

    let idxRes = 0;
    while (a && b) {
      if (a.getCuenta() <= b.getCuenta()) {
        tomados.push(a.getCuenta());
        nodoArbol.valores = tomados.slice();
        nodoArbol.resaltar = [idxRes];
        reg.capturar(cas, {
          titulo: "Fusionar",
          decision: `${a.getCuenta()} ≤ ${b.getCuenta()} → tomar de A`,
          tipo: "merge",
          resaltar: [a.getCuenta()],
          listaIds: tomados.slice(),
          mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
        });
        act.siguiente = a;
        a = a.siguiente;
      } else {
        tomados.push(b.getCuenta());
        nodoArbol.valores = tomados.slice();
        nodoArbol.resaltar = [idxRes];
        reg.capturar(cas, {
          titulo: "Fusionar",
          decision: `${a.getCuenta()} > ${b.getCuenta()} → tomar de B`,
          tipo: "merge",
          resaltar: [b.getCuenta()],
          listaIds: tomados.slice(),
          mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
        });
        act.siguiente = b;
        b = b.siguiente;
      }
      act = act.siguiente;
      idxRes = tomados.length;
    }
    act.siguiente = a || b;
    const res = dummy.siguiente;
    const idsFin = BS().serializarLista(res);
    nodoArbol.valores = idsFin;
    nodoArbol.estado = "ordenado";
    nodoArbol.resaltar = [];
    reg.capturar(cas, {
      titulo: "Fusión terminada",
      decision: `Subárbol ordenado: [${idsFin.join(", ")}]`,
      tipo: "fin",
      listaIds: idsFin,
      mergeArbol: MV().instantaneaArbol(raizArbol, nodoArbol.id),
    });
    return res;
  }

  /** Pasos educativos para mapa de funciones (sin estado de árbol) */
  function animarFlujoAPI(operacion) {
    const FLUJOS = {
      insertar: [
        {
          titulo: "BancoEstructura.insertar(cliente)",
          decision: "FACHADA: punto de entrada",
          detalle:
            "Valida null, coordina hash (balde) → árbol (duplicado + inserción RBT) → hash (nueva raíz) → lista (invalidar reporte si existía).",
          tipo: "inicio",
          estructura: "fachada",
          cadenaIdx: 0,
        },
        {
          titulo: "TablaHash.getRaizPorCuenta",
          decision: "HASH: ubicar el balde",
          detalle: "índice = cuenta % tamaño; lee casilleros[indice] como raíz del árbol de ese balde. Aún no se inserta nada.",
          tipo: "hash",
          estructura: "hash",
          cadenaIdx: 1,
        },
        {
          titulo: "ArbolRojoNegro.buscar",
          decision: "ÁRBOL: ¿cuenta duplicada?",
          detalle: "Recorre izquierdo/derecho por número de cuenta. Si ya existe → return false. No usa siguiente.",
          tipo: "buscar",
          estructura: "arbol",
          cadenaIdx: 2,
        },
        {
          titulo: "new NodoHibrido(cliente)",
          decision: "FACHADA: crear celda",
          detalle: "Objeto que almacena Cliente y punteros duales: izq/der/padre/esRojo para el RBT y siguiente para el reporte (inicialmente null).",
          tipo: "insertar",
          estructura: "fachada",
          cadenaIdx: 3,
        },
        {
          titulo: "ArbolRojoNegro.insertar",
          decision: "ÁRBOL: insertar y balancear",
          detalle: "insertarEnArbol (BST) + corregirInsercion (recoloración/rotaciones). Solo toca punteros del árbol.",
          tipo: "balanceo",
          estructura: "arbol",
          cadenaIdx: 4,
        },
        {
          titulo: "TablaHash.setRaizPorCuenta",
          decision: "HASH: guardar nueva raíz",
          detalle: "Tras rotaciones la raíz del balde puede cambiar; actualiza casilleros[indice].",
          tipo: "hash",
          estructura: "hash",
          cadenaIdx: 5,
        },
        {
          titulo: "invalidarReporte",
          decision: "LISTA: limpiar reporte cacheado",
          detalle: "ReporteLista.limpiarEnlaces: siguiente = null en todo el bosque. El árbol del balde queda intacto.",
          tipo: "fin",
          estructura: "lista",
          cadenaIdx: 6,
        },
      ],
      buscar: [
        {
          titulo: "BancoEstructura.buscar(cuenta)",
          decision: "FACHADA: API pública",
          detalle: "Solo lectura: no modifica hash, árbol ni lista. Devolverá Cliente o null.",
          tipo: "inicio",
          estructura: "fachada",
          cadenaIdx: 0,
        },
        {
          titulo: "buscarNodo (privado)",
          decision: "FACHADA: delegación interna",
          detalle: "Método privado que une TablaHash + ArbolRojoNegro; la API pública solo expone getDatos().",
          tipo: "default",
          estructura: "fachada",
          cadenaIdx: 1,
        },
        {
          titulo: "TablaHash.getRaizPorCuenta",
          decision: "HASH: raíz del balde",
          detalle: "calcularIndice(cuenta) y casilleros[i]. Si el casillero está vacío → null sin entrar al árbol.",
          tipo: "hash",
          estructura: "hash",
          cadenaIdx: 2,
        },
        {
          titulo: "ArbolRojoNegro.buscar",
          decision: "ÁRBOL: recorrer por cuenta",
          detalle: "while: si cuenta < nodo → izquierdo; si mayor → derecho. No usa siguiente ni esRojo para la lógica de búsqueda.",
          tipo: "comparar",
          estructura: "arbol",
          cadenaIdx: 3,
        },
        {
          titulo: "nodo.getDatos()",
          decision: "FACHADA: return Cliente o null",
          detalle: "Si buscar encontró nodo → getDatos(); si no → null. El reporte ordenado no interviene.",
          tipo: "fin",
          estructura: "fachada",
          cadenaIdx: 4,
        },
      ],
      eliminar: [
        {
          titulo: "BancoEstructura.eliminar(cuenta)",
          decision: "Entrada pública",
          detalle: "Orquesta hash → árbol del balde → (opcional) lista siguiente → baja en el RBT → actualizar casillero.",
          tipo: "inicio",
          estructura: "fachada",
          cadenaIdx: 0,
        },
        {
          titulo: "TablaHash.getRaizPorCuenta",
          decision: "HASH: ubicar el balde",
          detalle: "Calcula índice = cuenta % tamaño y lee casilleros[indice]. Aún no se borra nada del arreglo hash; solo se obtiene la raíz del árbol de ese balde.",
          tipo: "hash",
          estructura: "hash",
          cadenaIdx: 1,
        },
        {
          titulo: "ArbolRojoNegro.buscar",
          decision: "ÁRBOL: localizar el nodo",
          detalle: "Recorre el BST/RBT del balde usando izquierdo y derecho (no usa siguiente). Si no existe → return false.",
          tipo: "buscar",
          estructura: "arbol",
          cadenaIdx: 2,
        },
        {
          titulo: "ReporteLista.desenganchar",
          decision: "LISTA: solo si reporteGenerado",
          detalle: "Manipula únicamente el puntero siguiente: une anterior.siguiente con nodo.siguiente. El árbol (izq/der/padre) no se toca aquí.",
          tipo: "encadenar",
          estructura: "lista",
          cadenaIdx: 3,
        },
        {
          titulo: "ArbolRojoNegro.eliminar",
          decision: "ÁRBOL: borrar y balancear",
          detalle: "Si tiene dos hijos: intercambiarDatos con el sucesor (mínimo del subárbol derecho). Luego reemplaza el nodo y ejecuta corregirEliminacion si era negro. Usa izquierdo, derecho, padre, esRojo.",
          tipo: "balanceo",
          estructura: "arbol",
          cadenaIdx: 4,
        },
        {
          titulo: "TablaHash.setRaizPorCuenta",
          decision: "HASH: guardar nueva raíz",
          detalle: "Tras rotaciones la raíz del balde puede cambiar; se actualiza la referencia en el arreglo casilleros[indice].",
          tipo: "hash",
          estructura: "hash",
          cadenaIdx: 5,
        },
        {
          titulo: "invalidarReporte",
          decision: "LISTA: invalidar reporte cacheado",
          detalle: "ReporteLista.limpiarEnlaces: siguiente = null en todos los nodos del bosque. cabezaReporte = null. El árbol del balde sigue intacto para seguir buscando.",
          tipo: "fin",
          estructura: "lista",
          cadenaIdx: 6,
        },
      ],
      reporte: [
        {
          titulo: "BancoEstructura.generarReporteOrdenado()",
          decision: "FACHADA: API pública",
          detalle: "Guarda cabezaReporte y marca reporteGenerado = true. Delega la lógica pesada a ReporteLista.",
          tipo: "inicio",
          estructura: "fachada",
          cadenaIdx: 0,
        },
        {
          titulo: "ReporteLista.generarOrdenado",
          decision: "LISTA: orquestar fases",
          detalle: "Fase 1: limpiar + inorden por balde (hash recorre casilleros). Fase 2: MergeSort solo con siguiente.",
          tipo: "default",
          estructura: "lista",
          cadenaIdx: 1,
        },
        {
          titulo: "limpiarEnlaces",
          decision: "LISTA: resetear siguiente",
          detalle: "Recorre todos los nodos del bosque y pone siguiente = null antes de reconstruir el reporte.",
          tipo: "default",
          estructura: "lista",
          cadenaIdx: 2,
        },
        {
          titulo: "recorridoInordenEncadenar",
          decision: "HASH + ÁRBOL: por cada balde",
          detalle:
            "Tabla hash itera casilleros[]. En cada balde: inorden con izquierdo → nodo → derecho y encadena con siguiente (no destruye el árbol).",
          tipo: "encadenar",
          estructura: "arbol",
          cadenaIdx: 3,
        },
        {
          titulo: "mergeSortLista",
          decision: "LISTA: ordenar por cuenta",
          detalle: "Divide la lista enlazada (tortuga/liebre) y fusiona sublistas comparando cuenta. Solo puntero siguiente.",
          tipo: "merge",
          estructura: "lista",
          cadenaIdx: 4,
        },
        {
          titulo: "dividirLista + fusionarListas",
          decision: "LISTA: lista ordenada final",
          detalle: "Devuelve la cabeza de la lista global ordenada. Los árboles RBT de cada balde siguen en casilleros[].",
          tipo: "fin",
          estructura: "lista",
          cadenaIdx: 5,
        },
      ],
      contar: [
        {
          titulo: "BancoEstructura.contarClientes()",
          decision: "FACHADA: total en el banco",
          detalle: "API pública que suma clientes en todos los baldes. No usa siguiente ni genera reporte.",
          tipo: "inicio",
          estructura: "fachada",
          cadenaIdx: 0,
        },
        {
          titulo: "TablaHash.contarClientes",
          decision: "HASH: recorrer casilleros[]",
          detalle: "for cada índice: si casilleros[i] != null, suma el tamaño del árbol de ese balde.",
          tipo: "hash",
          estructura: "hash",
          cadenaIdx: 1,
        },
        {
          titulo: "ArbolRojoNegro.contar",
          decision: "ÁRBOL: 1 + izq + der",
          detalle: "Recursión sobre hijos izquierdo y derecho del balde. Ignora siguiente y esRojo para el conteo.",
          tipo: "fin",
          estructura: "arbol",
          cadenaIdx: 2,
        },
      ],
    };
    return { pasos: FLUJOS[operacion] || [] };
  }

  global.BancoAnim = {
    animarInsertar,
    animarBuscar,
    animarSoloRBT,
    animarSoloEliminarRBT,
    animarReporte,
    animarSoloMergeSort,
    animarFlujoAPI,
  };
})(typeof window !== "undefined" ? window : globalThis);
