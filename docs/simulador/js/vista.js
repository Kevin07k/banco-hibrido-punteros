/**
 * Aplica un paso de animación a hash, árbol y lista.
 */
(function (global) {
  "use strict";

  function reiniciarCanvasAnimacion(ui) {
    if (!ui) return;
    if (ui.canvas && global.BancoTransicion) {
      global.BancoTransicion.resetEstado(ui.canvas);
    }
    if (ui.canvasMerge && global.BancoMergeViz && global.BancoMergeViz.resetEstado) {
      global.BancoMergeViz.resetEstado(ui.canvasMerge);
    }
  }

  function aplicarPaso(paso, ui, opts) {
    const instant = opts && opts.instantaneo;
    const BD = global.BancoDoc;
    const BS = global.BancoSerial;
    if (!paso) return Promise.resolve(null);

    if (!paso.casilleros) {
      if (paso.listaIds && ui.listaEl) {
        pintarListaPorIds(ui.listaEl, paso.listaIds, paso.resaltar);
      }
      if (ui.cadenaFn && paso.cadenaIdx != null) {
        resaltarCadenaPaso(ui.cadenaFn, paso.cadenaIdx);
      }
      return Promise.resolve(null);
    }

    const cas = BS.deserializarCasilleros(paso.casilleros);
    const balde = paso.balde ?? paso.hashIdx ?? 0;
    const hashIdx = paso.hashIdx ?? balde;
    const tareas = [];

    if (ui.hashEl) {
      ui.hashEl.innerHTML = BD.renderHash(cas, hashIdx >= 0 ? hashIdx : -1);
    }

    if (ui.canvas && cas[balde] !== undefined) {
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
        instantaneo: !!instant,
      };
      tareas.push(
        new Promise((resolve) => {
          BD.dibujarArbol(ui.canvas, cas[balde], Object.assign({}, opArbol, { alTerminar: resolve }));
        })
      );
    }

    if (ui.listaEl && paso.listaIds) {
      pintarListaPorIds(ui.listaEl, paso.listaIds, paso.resaltar, paso.listaPunteros, {
        ordenada: paso.tipo === "fin" || (paso.titulo && /ordenad|fusión terminada|lista ordenada/i.test(paso.titulo + paso.decision)),
      });
    }

    if (ui.canvasMerge) {
      if (paso.mergeArbol) {
        const opMerge = { instantaneo: !!instant };
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
      } else if (paso.tipo === "encadenar" && paso.listaIds) {
        const arbolEnc = {
          id: 0,
          valores: paso.listaIds,
          estado: "raiz",
          activo: true,
          resaltar: [],
          izq: null,
          der: null,
        };
        const opMerge = { instantaneo: !!instant };
        tareas.push(
          new Promise((resolve) => {
            if (global.BancoMergeViz.pintarArbolMerge) {
              global.BancoMergeViz.pintarArbolMerge(
                ui.canvasMerge,
                arbolEnc,
                Object.assign({}, opMerge, { alTerminar: resolve })
              );
            } else {
              global.BancoMergeViz.dibujarArbolMerge(ui.canvasMerge, arbolEnc);
              resolve();
            }
          })
        );
      }
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

  function pintarListaPorIds(contenedor, ids, resaltar, listaPunteros, opciones) {
    const op = opciones || {};
    const set = new Set((resaltar || []).map(Number));
    const porId = new Map();
    (listaPunteros || []).forEach((p) => {
      const id = Number(p.id);
      if (!porId.has(id)) porId.set(id, []);
      porId.get(id).push(p.label || "actual");
    });
    contenedor.innerHTML = "";
    if (!ids || !ids.length) {
      contenedor.innerHTML = '<span class="nota">Sin lista todavía</span>';
      return;
    }

    const ordenada =
      op.ordenada ||
      (ids.length > 1 && ids.every((v, i) => i === 0 || ids[i - 1] <= v));

    if (ordenada && ids.length > 1) {
      const hint = document.createElement("p");
      hint.className = "lista-orden-ok";
      hint.textContent = "✓ Cuentas en orden creciente";
      contenedor.appendChild(hint);
    }

    const fila = document.createElement("div");
    fila.className = "lista-reporte-fila";

    ids.forEach((id, i) => {
      const wrap = document.createElement("div");
      wrap.className = "nodo-lista nodo-lista-reporte";
      (porId.get(id) || []).forEach((label) => {
        const badge = document.createElement("span");
        badge.className = "badge-puntero";
        badge.textContent = label;
        wrap.appendChild(badge);
      });
      const inner = document.createElement("div");
      inner.className = "nodo-lista-fila";
      const caja = document.createElement("div");
      caja.className = "caja-nodo" + (set.has(id) ? " resaltado" : "");
      caja.innerHTML = `<strong>${id}</strong>`;
      inner.appendChild(caja);
      if (i < ids.length - 1) {
        const f = document.createElement("span");
        f.className = "flecha flecha-reporte";
        f.innerHTML = '<span class="flecha-linea">→</span><span class="flecha-txt">siguiente</span>';
        inner.appendChild(f);
      }
      wrap.appendChild(inner);
      fila.appendChild(wrap);
    });
    contenedor.appendChild(fila);
  }

  global.BancoVista = {
    aplicarPaso,
    reiniciarCanvasAnimacion,
    pintarListaPorIds,
    resaltarCadenaPaso,
  };
})(typeof window !== "undefined" ? window : globalThis);
