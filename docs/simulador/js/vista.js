/**
 * Puente entre reproductor/motor y la capa visual.
 * Delega en BancoVisualUnificado (canvas + GSAP) cuando está disponible.
 */
(function (global) {
  "use strict";

  const estadoVista = {
    hashKey: "",
    casKey: "",
    listaKey: "",
    balde: -1,
  };

  function normalizarUi(ui) {
    if (!ui) return ui;
    const BV = global.BancoVisualUnificado;
    if (!ui.canvas && ui.canvasMerge) {
      return Object.assign({}, ui, {
        canvas: ui.canvasMerge,
        modo: ui.modo || "merge-lista",
      });
    }
    if (ui.canvas && !ui.modo && BV) {
      return Object.assign({}, ui, { modo: BV.modoDesdeUi(ui) });
    }
    return ui;
  }

  function usaUnificado(ui) {
    const u = normalizarUi(ui);
    return !!(global.BancoVisualUnificado && u && u.canvas);
  }

  function asegurarVisual(ui) {
    const u = normalizarUi(ui);
    if (!usaUnificado(u)) return u;
    const BV = global.BancoVisualUnificado;
    if (!BV.obtener(u.canvas)) {
      BV.init(u.canvas, {
        modo: u.modo,
        tamano: u.tamano,
        alturaLogica: parseInt(u.canvas.dataset.alturaLogica, 10) || undefined,
      });
    }
    return u;
  }

  function reiniciarCanvasAnimacion(ui) {
    if (!ui) return;
    estadoVista.hashKey = "";
    estadoVista.casKey = "";
    estadoVista.listaKey = "";
    estadoVista.balde = -1;
    const u = asegurarVisual(ui);
    if (usaUnificado(u)) {
      global.BancoVisualUnificado.reiniciar(u);
      return;
    }
    if (ui.canvas && global.BancoTransicion) {
      global.BancoTransicion.resetEstado(ui.canvas);
    }
    if (ui.canvasMerge && global.BancoMergeViz && global.BancoMergeViz.resetEstado) {
      global.BancoMergeViz.resetEstado(ui.canvasMerge);
    }
  }

  function esPasoSoloReporte(paso) {
    if (!paso) return false;
    return paso.tipo === "merge" || paso.tipo === "fin";
  }

  function necesitaArbol(paso) {
    if (!paso || !paso.casilleros) return false;
    if (esPasoSoloReporte(paso)) return false;
    return true;
  }

  function aplicarPaso(paso, ui, opts) {
    const u = asegurarVisual(ui);
    if (usaUnificado(u)) {
      return global.BancoVisualUnificado.aplicarPaso(paso, u, opts);
    }
    return aplicarPasoLegacy(paso, ui, opts);
  }

  function aplicarPasoLegacy(paso, ui, opts) {
    const instant = opts && opts.instantaneo;
    const BD = global.BancoDoc;
    const BS = global.BancoSerial;
    if (!paso) return Promise.resolve(null);

    if (!paso.casilleros) {
      if (paso.listaIds && ui.listaEl) {
        pintarListaPorIds(ui.listaEl, paso.listaIds, paso.resaltar, paso.listaPunteros);
      }
      if (ui.cadenaFn && paso.cadenaIdx != null) {
        resaltarCadenaPaso(ui.cadenaFn, paso.cadenaIdx);
      }
      return Promise.resolve(null);
    }

    const casKey = JSON.stringify(paso.casilleros);
    const cas = BS.deserializarCasilleros(paso.casilleros);
    const balde = paso.balde ?? paso.hashIdx ?? 0;
    const hashIdx = paso.hashIdx ?? balde;
    const tareas = [];
    const soloReporte = esPasoSoloReporte(paso);
    const pintarArbol = necesitaArbol(paso);

    if (ui.hashEl && casKey !== estadoVista.hashKey) {
      ui.hashEl.innerHTML = BD.renderHash(cas, hashIdx >= 0 ? hashIdx : -1);
      estadoVista.hashKey = casKey;
    } else if (ui.hashEl && hashIdx >= 0) {
      const activo = ui.hashEl.querySelector(".casillero.resaltado");
      const idxActivo = activo ? parseInt(activo.dataset.idx, 10) : -1;
      if (idxActivo !== hashIdx) {
        ui.hashEl.innerHTML = BD.renderHash(cas, hashIdx);
        estadoVista.hashKey = casKey;
      }
    }

    if (ui.canvas && cas[balde] !== undefined && pintarArbol) {
      const arbolCambio = casKey !== estadoVista.casKey || balde !== estadoVista.balde;
      const opArbol = {
        resaltar: paso.resaltar,
        cursor: paso.cursor,
        pivot: paso.pivot,
        puntero: paso.puntero,
        punteroPadre: paso.punteroPadre,
        punteroLabel: paso.punteroLabel,
        punteroDir: paso.punteroDir,
        punteroEsNulo: paso.punteroEsNulo,
        busqueda: paso.busqueda,
        instantaneo: !!instant || !arbolCambio,
      };
      if (arbolCambio || !instant) {
        tareas.push(
          new Promise((resolve) => {
            BD.dibujarArbol(ui.canvas, cas[balde], Object.assign({}, opArbol, { alTerminar: resolve }));
          })
        );
        estadoVista.casKey = casKey;
        estadoVista.balde = balde;
      } else {
        BD.dibujarArbol(ui.canvas, cas[balde], opArbol);
        estadoVista.casKey = casKey;
        estadoVista.balde = balde;
      }
    }

    if (ui.listaEl && paso.listaIds) {
      const listaKey = JSON.stringify({
        ids: paso.listaIds,
        res: paso.resaltar,
        ptr: paso.listaPunteros,
        ord: paso.tipo === "fin",
      });
      if (listaKey !== estadoVista.listaKey) {
        pintarListaPorIds(ui.listaEl, paso.listaIds, paso.resaltar, paso.listaPunteros, {
          ordenada:
            paso.tipo === "fin" ||
            (paso.titulo && /ordenad|fusión terminada|lista ordenada/i.test(paso.titulo + (paso.decision || ""))),
        });
        estadoVista.listaKey = listaKey;
      } else {
        actualizarResaltadoLista(ui.listaEl, paso.listaIds, paso.resaltar, paso.listaPunteros);
      }
    }

    if (ui.canvasMerge && paso.mergeArbol) {
      const opMerge = { instantaneo: !!instant || soloReporte };
      tareas.push(
        new Promise((resolve) => {
          if (global.BancoMergeViz.pintarArbolMerge) {
            global.BancoMergeViz.pintarArbolMerge(
              ui.canvasMerge,
              paso.mergeArbol,
              Object.assign({}, opMerge, { alTerminar: resolve })
            );
          } else {
            global.BancoMergeViz.dibujarArbolMerge(ui.canvasMerge, paso.mergeArbol);
            resolve();
          }
        })
      );
    }

    const claveHash = paso.cursor ?? paso.busqueda;
    if (ui.formulaEl && claveHash != null && ui.tamano) {
      const idx = BD.calcularIndice(claveHash, ui.tamano);
      ui.formulaEl.textContent =
        paso.tipo === "hash"
          ? `${claveHash} % ${ui.tamano} = ${idx}  →  casilleros[${idx}]`
          : ui.formulaEl.textContent;
    }

    if (ui.cadenaFn && paso.cadenaIdx != null) {
      resaltarCadenaPaso(ui.cadenaFn, paso.cadenaIdx);
    }

    if (!tareas.length) return Promise.resolve(cas);
    return Promise.all(tareas).then(() => cas);
  }

  function resaltarCadenaPaso(cadenaEl, indice) {
    const idx = String(indice);
    cadenaEl.querySelectorAll("[data-paso]").forEach((el) => {
      const activo = el.dataset.paso === idx;
      const wrap = el.classList.contains("paso-cadena") ? el : el.closest(".paso-cadena");
      if (wrap) wrap.classList.toggle("activo-fn", activo);
      else el.classList.toggle("activo-fn", activo);
    });
  }

  function actualizarResaltadoLista(contenedor, ids, resaltar, listaPunteros) {
    const set = new Set((resaltar || []).map(Number));
    const porId = new Map();
    (listaPunteros || []).forEach((p) => {
      const id = Number(p.id);
      if (!porId.has(id)) porId.set(id, []);
      porId.get(id).push(p.label || "actual");
    });
    contenedor.querySelectorAll("[data-cuenta]").forEach((caja) => {
      const id = Number(caja.dataset.cuenta);
      caja.classList.toggle("resaltado", set.has(id));
      const wrap = caja.closest(".nodo-lista-reporte");
      if (!wrap) return;
      wrap.querySelectorAll(".badge-puntero").forEach((b) => b.remove());
      (porId.get(id) || []).forEach((label) => {
        const badge = document.createElement("span");
        badge.className = "badge-puntero";
        badge.textContent = label;
        wrap.insertBefore(badge, wrap.firstChild);
      });
    });
  }

  function pintarListaPorIds(contenedor, ids, resaltar, listaPunteros, opciones) {
    const canvasUni = document.getElementById("canvasUnificado");
    if (canvasUni && usaUnificado({ canvas: canvasUni })) {
      const uiUni = { canvas: canvasUni };
      if (!ids || !ids.length) {
        global.BancoVisualUnificado.pintarVacio(uiUni);
        return;
      }
      return global.BancoVisualUnificado.aplicarPaso(
        { listaIds: ids, resaltar, listaPunteros },
        uiUni,
        { instantaneo: true }
      );
    }

    const op = opciones || {};
    const set = new Set((resaltar || []).map(Number));
    const porId = new Map();
    (listaPunteros || []).forEach((p) => {
      const id = Number(p.id);
      if (!porId.has(id)) porId.set(id, []);
      porId.get(id).push(p.label || "actual");
    });

    const ordenada =
      op.ordenada || (ids.length > 1 && ids.every((v, i) => i === 0 || ids[i - 1] <= v));

    let fila = contenedor.querySelector(".lista-reporte-fila");
    let hint = contenedor.querySelector(".lista-orden-ok");

    if (!ids || !ids.length) {
      contenedor.innerHTML = '<span class="nota">Sin lista todavía</span>';
      return;
    }

    if (!fila) {
      contenedor.innerHTML = "";
      fila = document.createElement("div");
      fila.className = "lista-reporte-fila";
      contenedor.appendChild(fila);
    }

    if (ordenada && ids.length > 1) {
      if (!hint) {
        hint = document.createElement("p");
        hint.className = "lista-orden-ok";
        hint.textContent = "✓ Cuentas en orden creciente";
        contenedor.insertBefore(hint, fila);
      }
    } else if (hint) {
      hint.remove();
    }

    const nodosDom = new Map();
    fila.querySelectorAll("[data-cuenta]").forEach((el) => {
      nodosDom.set(Number(el.dataset.cuenta), el.closest(".nodo-lista-reporte"));
    });

    ids.forEach((id, i) => {
      let wrap = nodosDom.get(id);
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "nodo-lista nodo-lista-reporte";
        fila.appendChild(wrap);
      } else {
        nodosDom.delete(id);
      }

      wrap.querySelectorAll(".badge-puntero").forEach((b) => b.remove());
      (porId.get(id) || []).forEach((label) => {
        const badge = document.createElement("span");
        badge.className = "badge-puntero";
        badge.textContent = label;
        wrap.appendChild(badge);
      });

      let inner = wrap.querySelector(".nodo-lista-fila");
      if (!inner) {
        inner = document.createElement("div");
        inner.className = "nodo-lista-fila";
        wrap.appendChild(inner);
      }

      let caja = inner.querySelector("[data-cuenta]");
      if (!caja) {
        caja = document.createElement("div");
        caja.className = "caja-nodo";
        caja.dataset.cuenta = String(id);
        inner.appendChild(caja);
      }
      caja.className = "caja-nodo" + (set.has(id) ? " resaltado" : "");
      caja.dataset.cuenta = String(id);
      caja.innerHTML = `<strong>${id}</strong>`;

      let flecha = inner.querySelector(".flecha-reporte");
      if (i < ids.length - 1) {
        if (!flecha) {
          flecha = document.createElement("span");
          flecha.className = "flecha flecha-reporte";
          flecha.innerHTML =
            '<span class="flecha-linea">→</span><span class="flecha-txt">siguiente</span>';
          inner.appendChild(flecha);
        }
      } else if (flecha) {
        flecha.remove();
      }

      fila.appendChild(wrap);
    });

    nodosDom.forEach((wrap) => wrap.remove());
  }

  global.BancoVista = {
    aplicarPaso,
    reiniciarCanvasAnimacion,
    pintarListaPorIds,
    resaltarCadenaPaso,
  };
})(typeof window !== "undefined" ? window : globalThis);
