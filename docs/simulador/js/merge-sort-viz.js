/**
 * Árbol de recursión del MergeSort — layout por anchos reales (sin solapar nodos).
 * Aristas en “escalera” solo aquí (cajas anchas); los árboles RBT usan líneas diagonales.
 */
(function (global) {
  "use strict";

  const GAP_H = 32;
  const ROW_V = 92;
  const PAD_TOP = 28;
  const PAD_SIDE = 32;
  const MAX_CELDAS_VISIBLES = 7;

  function clonarArbol(n) {
    if (!n) return null;
    return {
      id: n.id,
      valores: n.valores.slice(),
      estado: n.estado,
      activo: !!n.activo,
      resaltar: (n.resaltar || []).slice(),
      izq: clonarArbol(n.izq),
      der: clonarArbol(n.der),
    };
  }

  function crearNodoMerge(idGen, valores) {
    return {
      id: idGen(),
      valores: valores.slice(),
      izq: null,
      der: null,
      estado: "activo",
      resaltar: [],
    };
  }

  function instantaneaArbol(raiz, activoId) {
    function walk(n) {
      if (!n) return null;
      return {
        id: n.id,
        valores: n.valores.slice(),
        estado: n.estado,
        activo: n.id === activoId,
        resaltar: Array.isArray(n.resaltar) ? n.resaltar.slice() : [],
        izq: walk(n.izq),
        der: walk(n.der),
      };
    }
    return walk(raiz);
  }

  function profundidadMax(n) {
    if (!n) return 0;
    return 1 + Math.max(profundidadMax(n.izq), profundidadMax(n.der));
  }

  function cellSize(nVals) {
    if (nVals > MAX_CELDAS_VISIBLES) return 0;
    if (nVals > 5) return 40;
    if (nVals > 3) return 46;
    return 50;
  }

  function anchoNodo(n) {
    const nV = n.valores.length;
    if (nV > MAX_CELDAS_VISIBLES) {
      const txt = `${n.valores[0]} … ${n.valores[nV - 1]}  (${nV})`;
      return Math.min(140, 14 + txt.length * 6.5);
    }
    const cw = cellSize(nV);
    return Math.max(56, nV * cw + 14);
  }

  const BOX_TOP_OFF = 2;
  const BOX_H = 36;

  /** Caja dibujada en dibujarNodo — mismas medidas para los conectores. */
  function metricasCaja(n) {
    return {
      cx: n._px,
      top: n._py - BOX_TOP_OFF,
      bottom: n._py - BOX_TOP_OFF + BOX_H,
      halfW: anchoNodo(n) / 2,
    };
  }

  function recentrarPadre(n) {
    if (n.izq && n.der) n._px = (n.izq._px + n.der._px) / 2;
    else if (n.izq) n._px = n.izq._px;
    else if (n.der) n._px = n.der._px;
  }

  /** Asigna _px, _py; devuelve ancho total del subárbol. */
  function layoutSubarbol(n, depth, left) {
    if (!n) return 0;

    const wSelf = anchoNodo(n);
    n._py = PAD_TOP + depth * ROW_V;

    if (!n.izq && !n.der) {
      n._px = left + wSelf / 2;
      return wSelf;
    }

    let x = left;
    let wIzq = 0;
    let wDer = 0;

    if (n.izq) {
      wIzq = layoutSubarbol(n.izq, depth + 1, x);
      x += wIzq;
      if (n.der) x += GAP_H;
    }
    if (n.der) {
      wDer = layoutSubarbol(n.der, depth + 1, x);
    }

    const spanHijos = wIzq + (n.izq && n.der ? GAP_H : 0) + wDer;
    const totalW = Math.max(wSelf, spanHijos);

    recentrarPadre(n);

    if (spanHijos < wSelf) {
      const extra = (wSelf - spanHijos) / 2;
      if (n.izq) desplazarSubarbol(n.izq, extra);
      if (n.der) desplazarSubarbol(n.der, extra);
      recentrarPadre(n);
    }

    return totalW;
  }

  function desplazarSubarbol(n, dx) {
    if (!n) return;
    n._px += dx;
    desplazarSubarbol(n.izq, dx);
    desplazarSubarbol(n.der, dx);
  }

  function recogerNodos(n, out) {
    if (!n) return;
    recogerNodos(n.izq, out);
    out.push(n);
    recogerNodos(n.der, out);
  }

  function snap(n) {
    return Math.round(n);
  }

  function snapLine(n) {
    return Math.round(n) + 0.5;
  }

  function alturaLogicaArbol(arbol) {
    const d = profundidadMax(arbol);
    return Math.max(320, PAD_TOP + d * ROW_V + 56);
  }

  const DUR_MERGE_MS = 400;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function serializarMerge(n) {
    if (!n) return null;
    return {
      id: n.id,
      valores: n.valores,
      estado: n.estado,
      activo: n.activo,
      resaltar: n.resaltar || [],
      izq: serializarMerge(n.izq),
      der: serializarMerge(n.der),
    };
  }

  function mismaInstantaneaMerge(a, b) {
    return JSON.stringify(serializarMerge(a)) === JSON.stringify(serializarMerge(b));
  }

  function dibujarVacioMerge(ctx, w, h) {
    ctx.fillStyle = "#64748b";
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Carga un escenario y anima el reporte", w / 2, h / 2 - 8);
    ctx.fillStyle = "#475569";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Árbol de recursión del MergeSort", w / 2, h / 2 + 12);
  }

  function vistaMergeIdeal(w, h, minX, maxX, minY, maxY) {
    const bw = Math.max(maxX - minX, 1);
    const bh = Math.max(maxY - minY, 1);
    const pad = 20;
    const scale = Math.min(1, (w - pad * 2) / bw, (h - pad * 2) / bh);
    const tx = pad + (w - pad * 2 - bw * scale) / 2 - minX * scale;
    const ty = pad + (h - pad * 2 - bh * scale) / 2 - minY * scale;
    return { scale, tx, ty };
  }

  function dibujarContenidoMerge(ctx, arbol, w, h, dpr) {
    const copia = clonarArbol(arbol);
    const escala = dpr >= 2 ? 1.05 : 1;
    layoutSubarbol(copia, 0, PAD_SIDE);
    const nodos = [];
    recogerNodos(copia, nodos);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    nodos.forEach((n) => {
      const hw = anchoNodo(n) / 2 + 12;
      minX = Math.min(minX, n._px - hw);
      maxX = Math.max(maxX, n._px + hw);
      minY = Math.min(minY, n._py - 36);
      maxY = Math.max(maxY, n._py + 52);
    });

    const vista = vistaMergeIdeal(w, h, minX, maxX, minY, maxY);

    ctx.save();
    ctx.translate(vista.tx, vista.ty);
    ctx.scale(vista.scale, vista.scale);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    nodos.forEach((n) => {
      if (!n.izq && !n.der) return;
      const padre = metricasCaja(n);
      const dibujarArista = (hijo) => {
        const h = metricasCaja(hijo);
        const yMedio = (padre.bottom + h.top) / 2;
        ctx.beginPath();
        ctx.moveTo(snapLine(padre.cx), snapLine(padre.bottom));
        ctx.lineTo(snapLine(padre.cx), snapLine(yMedio));
        ctx.lineTo(snapLine(h.cx), snapLine(yMedio));
        ctx.lineTo(snapLine(h.cx), snapLine(h.top));
        ctx.stroke();
      };
      if (n.izq) dibujarArista(n.izq);
      if (n.der) dibujarArista(n.der);
    });
    nodos.forEach((n) => dibujarNodo(ctx, n, escala));
    ctx.restore();
  }

  function cancelarMerge(canvas) {
    if (!canvas || !canvas._rafMerge) return;
    cancelAnimationFrame(canvas._rafMerge);
    canvas._rafMerge = null;
  }

  function resetEstado(canvas) {
    cancelarMerge(canvas);
    if (!canvas) return;
    canvas._mergeSnap = null;
  }

  function animarCrossfadeMerge(canvas, ant, nuevo, alTerminar) {
    cancelarMerge(canvas);
    if (!global.BancoCanvas) {
      dibujarArbolMerge(canvas, nuevo);
      if (alTerminar) alTerminar();
      return;
    }

    const altura = Math.max(
      ant ? alturaLogicaArbol(ant) : 360,
      nuevo ? alturaLogicaArbol(nuevo) : 360
    );
    canvas.dataset.alturaLogica = String(altura);
    const t0 = performance.now();

    function frame(now) {
      if (!canvas._rafMerge) return;
      const t = Math.min(1, (now - t0) / DUR_MERGE_MS);
      const te = easeInOut(t);
      const { ctx, w, h, dpr } = global.BancoCanvas.preparar(canvas, altura);
      ctx.clearRect(0, 0, w, h);

      if (ant) {
        ctx.save();
        ctx.globalAlpha = 1 - te;
        dibujarContenidoMerge(ctx, ant, w, h, dpr);
        ctx.restore();
      } else if (!nuevo) {
        ctx.save();
        ctx.globalAlpha = 1 - te;
        dibujarVacioMerge(ctx, w, h);
        ctx.restore();
      }

      if (nuevo) {
        ctx.save();
        ctx.globalAlpha = ant ? te : te;
        dibujarContenidoMerge(ctx, nuevo, w, h, dpr);
        ctx.restore();
      } else if (!ant) {
        ctx.save();
        ctx.globalAlpha = te;
        dibujarVacioMerge(ctx, w, h);
        ctx.restore();
      }

      if (t < 1) {
        canvas._rafMerge = requestAnimationFrame(frame);
      } else {
        canvas._rafMerge = null;
        dibujarArbolMerge(canvas, nuevo);
        if (alTerminar) alTerminar();
      }
    }

    canvas._rafMerge = requestAnimationFrame(frame);
  }

  function pintarArbolMerge(canvas, arbol, opts) {
    const done = opts && opts.alTerminar;
    if (!global.BancoCanvas) {
      if (done) done();
      return;
    }
    const instant = opts && opts.instantaneo;
    const snap = arbol ? clonarArbol(arbol) : null;
    const ant = canvas._mergeSnap;

    function terminar() {
      if (done) done();
    }

    if (instant) {
      cancelarMerge(canvas);
      dibujarArbolMerge(canvas, arbol);
      canvas._mergeSnap = snap;
      terminar();
      return;
    }

    if (mismaInstantaneaMerge(ant, snap)) {
      dibujarArbolMerge(canvas, arbol);
      canvas._mergeSnap = snap;
      terminar();
      return;
    }

    animarCrossfadeMerge(canvas, ant, arbol, () => {
      canvas._mergeSnap = snap;
      terminar();
    });
  }

  function dibujarArbolMerge(canvas, arbol) {
    if (!global.BancoCanvas) return;

    if (!arbol) {
      const altura = parseInt(canvas.dataset.alturaLogica, 10) || 360;
      const { ctx, w, h } = global.BancoCanvas.preparar(canvas, altura);
      dibujarVacioMerge(ctx, w, h);
      return;
    }

    const altura = alturaLogicaArbol(arbol);
    canvas.dataset.alturaLogica = String(altura);
    const { ctx, w, h, dpr } = global.BancoCanvas.preparar(canvas, altura);
    dibujarContenidoMerge(ctx, arbol, w, h, dpr);

    if (global.BancoCanvas.observar && canvas._redibujar) {
      canvas._alturaMerge = altura;
    }
  }

  function dibujarNodo(ctx, nodo, escala) {
    const s = escala || 1;
    const vals = nodo.valores;
    const y = snap(nodo._py);
    const x = snap(nodo._px);

    const estados = {
      base: { t: "caso base", c: "#34d399" },
      fusion: { t: "fusionar", c: "#a5b4fc" },
      dividido: { t: "dividido", c: "#fbbf24" },
      dividiendo: { t: "dividiendo", c: "#fb923c" },
      raiz: { t: "raíz global", c: "#38bdf8" },
    };
    const est = estados[nodo.estado];
    if (est) {
      ctx.fillStyle = est.c;
      ctx.font = `bold ${Math.round(10 * s)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(est.t, x, y - 26);
    }

    if (vals.length > MAX_CELDAS_VISIBLES) {
      dibujarPillCompacta(ctx, nodo, s);
      return;
    }

    const cw = cellSize(vals.length);
    const totalW = vals.length * cw;
    const x0 = x - totalW / 2;
    if (nodo.activo) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      roundRect(ctx, x0 - 8, y - 8, totalW + 16, BOX_H + 16, 10);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      roundRect(ctx, x0 - 8, y - 8, totalW + 16, BOX_H + 16, 10);
      ctx.stroke();
    }

    vals.forEach((v, i) => {
      const cx = x0 + i * cw;
      const resaltado = nodo.resaltar && nodo.resaltar.includes(i);
      const activo = nodo.activo && resaltado;

      ctx.fillStyle = activo ? "#16a34a" : "#1e293b";
      ctx.strokeStyle = activo ? "#22c55e" : "#64748b";
      ctx.lineWidth = 2;
      roundRect(ctx, cx + 3, y - BOX_TOP_OFF, cw - 6, BOX_H, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = activo ? "#fff" : "#f1f5f9";
      ctx.font = `bold ${Math.round(13 * s)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(v), snap(cx + cw / 2), snap(y + 14));

      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.round(9 * s)}px system-ui, sans-serif`;
      ctx.fillText(String(i), snap(cx + cw / 2), snap(y + 30));
    });
  }

  function dibujarPillCompacta(ctx, nodo, s) {
    const y = snap(nodo._py);
    const x = snap(nodo._px);
    const vals = nodo.valores;
    const txt = `${vals[0]} … ${vals[vals.length - 1]}  (${vals.length})`;
    const w = Math.min(140, 14 + txt.length * 6.5);
    if (nodo.activo) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
      roundRect(ctx, x - w / 2 - 6, y - 6, w + 12, BOX_H + 8, 8);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      roundRect(ctx, x - w / 2 - 6, y - 6, w + 12, BOX_H + 8, 8);
      ctx.stroke();
    }

    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    roundRect(ctx, x - w / 2, y - BOX_TOP_OFF, w, BOX_H, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = `bold ${Math.round(12 * s)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x, y + 14);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  global.BancoMergeViz = {
    crearNodoMerge,
    instantaneaArbol,
    clonarArbol,
    dibujarArbolMerge,
    pintarArbolMerge,
    resetEstado,
    cancelarMerge,
    alturaLogicaArbol,
  };
})(typeof window !== "undefined" ? window : globalThis);
