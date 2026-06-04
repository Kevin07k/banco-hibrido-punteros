/**
 * Transiciones suaves entre estados de un árbol RBT (morph), para el simulador paso a paso.
 * Las aristas en escalera solo se usan en merge-sort-viz.js.
 */
(function (global) {
  "use strict";

  const NODE_R = 26;
  const M = { t: 58, b: 52, l: 68, r: 68 };
  const DUR_MS = 380;
  const DUR_FUNDIDO_MS = 280;
  const SNAP_DIST = 14;
  const ROW_V = 72;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function clonarRaiz(raiz) {
    if (!raiz || !global.BancoSerial) return null;
    const BS = global.BancoSerial;
    return BS.deserializarArbol(BS.serializarArbol(raiz));
  }

  function listarAristas(raiz) {
    const e = [];
    function walk(n) {
      if (!n) return;
      const c = n.getCuenta();
      if (n.izquierdo) e.push([c, n.izquierdo.getCuenta()]);
      if (n.derecho) e.push([c, n.derecho.getCuenta()]);
      walk(n.izquierdo);
      walk(n.derecho);
    }
    walk(raiz);
    return e;
  }

  function layoutPosiciones(raiz, w, h) {
    const pos = new Map();
    if (!raiz) return { pos, aristas: [] };

    const layout = [];
    function medir(n, depth, xMin, xMax) {
      if (!n) return;
      const mid = (xMin + xMax) / 2;
      layout.push({ n, x: mid, y: depth });
      medir(n.izquierdo, depth + 1, xMin, mid);
      medir(n.derecho, depth + 1, mid, xMax);
    }
    medir(raiz, 0, 0, 1);
    const maxD = Math.max(...layout.map((l) => l.y), 0);
    const scaleY = maxD > 0 ? (h - M.t - M.b) / maxD : 0;

    layout.forEach(({ n, x, y }) => {
      pos.set(n.getCuenta(), {
        x: M.l + x * (w - M.l - M.r),
        y: M.t + y * scaleY,
        esRojo: n.esRojo,
      });
    });
    return { pos, aristas: listarAristas(raiz) };
  }

  function vistaEncajar(w, h, bounds, margen) {
    const pad = margen == null ? 28 : margen;
    const bw = Math.max(bounds.maxX - bounds.minX, 1);
    const bh = Math.max(bounds.maxY - bounds.minY, 1);
    const scale = Math.min(1, (w - pad * 2) / bw, (h - pad * 2) / bh);
    const tx = pad + (w - pad * 2 - bw * scale) / 2 - bounds.minX * scale;
    const ty = pad + (h - pad * 2 - bh * scale) / 2 - bounds.minY * scale;
    return { scale, tx, ty };
  }

  function boundsDePosiciones(maps) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const grow = (x, y, r) => {
      const rad = r != null ? r : NODE_R;
      minX = Math.min(minX, x - rad - 8);
      maxX = Math.max(maxX, x + rad + 8);
      minY = Math.min(minY, y - rad - 24);
      maxY = Math.max(maxY, y + rad + 12);
    };
    maps.forEach((m) => m.forEach((p) => grow(p.x, p.y)));
    if (!isFinite(minX)) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    return { minX, minY, maxX, maxY };
  }

  function profundidadArbol(raiz) {
    let max = 0;
    function walk(n, d) {
      if (!n) return;
      max = Math.max(max, d);
      walk(n.izquierdo, d + 1);
      walk(n.derecho, d + 1);
    }
    walk(raiz, 0);
    return max;
  }

  function alturaLogicaArbol(raiz) {
    const d = raiz ? profundidadArbol(raiz) : 0;
    return Math.max(320, M.t + M.b + Math.max(d, 1) * ROW_V);
  }

  function limpiarEstableCanvas(canvas) {
    if (!canvas) return;
    delete canvas._btPos;
  }

  function guardarPosicionesCanvas(canvas, pos) {
    if (!canvas || !pos) return;
    const copia = new Map();
    pos.forEach((p, cuenta) => {
      copia.set(cuenta, { x: p.x, y: p.y, esRojo: p.esRojo });
    });
    canvas._btPos = copia;
  }

  function asignarLayoutANodos(raiz, pos) {
    const layout = [];
    function walk(n) {
      if (!n) return;
      const p = pos.get(n.getCuenta());
      if (p) {
        n._px = p.x;
        n._py = p.y;
      }
      layout.push({ n });
      walk(n.izquierdo);
      walk(n.derecho);
    }
    walk(raiz);
    return layout;
  }

  function soloCambianApariencia(escena) {
    return escena.nodos.every((n) => {
      if (n.soloA || n.soloD) return false;
      return Math.hypot(n.x1 - n.x0, n.y1 - n.y0) < 1.5;
    });
  }

  function prepararEscena(raizA, raizB, w, h, canvas) {
    const a = raizA ? clonarRaiz(raizA) : null;
    const b = raizB ? clonarRaiz(raizB) : null;
    const la = layoutPosiciones(a, w, h);
    const lb = layoutPosiciones(b, w, h);
    const prev = canvas && canvas._btPos;
    const cuentas = new Set([...la.pos.keys(), ...lb.pos.keys()]);
    const nodos = [];
    const posFinal = new Map();

    cuentas.forEach((cuenta) => {
      const pa = la.pos.get(cuenta);
      const pb = lb.pos.get(cuenta);
      let x0 = pa ? pa.x : pb.x;
      let y0 = pa ? pa.y : pb.y;
      if (prev && prev.has(cuenta)) {
        x0 = prev.get(cuenta).x;
        y0 = prev.get(cuenta).y;
      }
      let x1 = pb ? pb.x : pa.x;
      let y1 = pb ? pb.y : pa.y;
      if (pa && pb) {
        const d = Math.hypot(x1 - x0, y1 - y0);
        if (d < SNAP_DIST) {
          x1 = x0;
          y1 = y0;
        }
      }
      nodos.push({
        cuenta,
        x0,
        y0,
        x1,
        y1,
        rojo0: pa ? pa.esRojo : pb.esRojo,
        rojo1: pb ? pb.esRojo : pa.esRojo,
        soloA: !pb,
        soloD: !pa,
      });
      posFinal.set(cuenta, { x: x1, y: y1, esRojo: pb ? pb.esRojo : pa.esRojo });
    });

    const bounds = boundsDePosiciones([la.pos, lb.pos, posFinal]);
    const vista = vistaEncajar(w, h, bounds, 28);

    return {
      nodos,
      aristasA: la.aristas,
      aristasD: lb.aristas,
      vista,
      posFinal,
    };
  }

  function posEnT(n, t) {
    const te = easeInOut(t);
    let alpha = 1;
    let scale = 1;
    if (n.soloA) {
      alpha = 1 - te;
      scale = 1 - 0.65 * te;
    } else if (n.soloD) {
      alpha = te;
      scale = 0.35 + 0.65 * te;
    }
    return {
      x: n.x0 + (n.x1 - n.x0) * te,
      y: n.y0 + (n.y1 - n.y0) * te,
      rojo: te < 0.5 ? n.rojo0 : n.rojo1,
      alpha,
      scale,
    };
  }

  function dibujarArista(ctx, x1, y1, x2, y2, alpha) {
    if (alpha < 0.04) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarNodo(ctx, p, cuenta, resaltar, alphaExtra, alphaRes) {
    if (p.alpha < 0.04) return;
    const alpha = p.alpha * (alphaExtra != null ? alphaExtra : 1);
    const px = p.x;
    const py = p.y;
    const r = NODE_R * (p.scale != null ? p.scale : 1);
    const aRes = alphaRes != null ? alphaRes : resaltar.has(cuenta) ? 1 : 0;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (aRes > 0.04) {
      ctx.beginPath();
      ctx.arc(px, py, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = p.rojo ? "#7f1d1d" : "#1e293b";
    ctx.fill();
    ctx.strokeStyle = p.rojo ? "#ef4444" : "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(cuenta), px, py);
    ctx.restore();
  }

  function dibujarMorphFrame(ctx, escena, t, op) {
    const resaltar = new Set((op.resaltar || []).map(Number));
    const pos = new Map();
    escena.nodos.forEach((n) => pos.set(n.cuenta, posEnT(n, t)));

    const te = easeInOut(t);
    const fadePunteros = Math.max(0, (t - 0.5) / 0.5);
    const nodeAlpha = 1 - fadePunteros * 0.1;

    ctx.save();
    ctx.translate(escena.vista.tx, escena.vista.ty);
    ctx.scale(escena.vista.scale, escena.vista.scale);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";

    escena.aristasA.forEach(([p, h]) => {
      const a = pos.get(p);
      const b = pos.get(h);
      if (a && b) dibujarArista(ctx, a.x, a.y, b.x, b.y, (1 - te) * Math.min(a.alpha, b.alpha));
    });
    escena.aristasD.forEach(([p, h]) => {
      const a = pos.get(p);
      const b = pos.get(h);
      if (a && b) dibujarArista(ctx, a.x, a.y, b.x, b.y, te * Math.min(a.alpha, b.alpha));
    });

    escena.nodos.forEach((n) => {
      const p = pos.get(n.cuenta);
      const alphaRes =
        op.resaltarAlpha && op.resaltarAlpha[n.cuenta] != null
          ? op.resaltarAlpha[n.cuenta] * nodeAlpha
          : resaltar.has(n.cuenta)
            ? nodeAlpha
            : 0;
      dibujarNodo(ctx, p, n.cuenta, resaltar, nodeAlpha, alphaRes);
    });

    ctx.restore();
    return { fadePunteros };
  }

  function cancelar(canvas) {
    if (!canvas) return;
    if (canvas._rafTransicion) {
      cancelAnimationFrame(canvas._rafTransicion);
      canvas._rafTransicion = null;
    }
    if (canvas._btAnimObjetivo !== undefined) {
      canvas._btRaiz = canvas._btAnimObjetivo;
      canvas._btOp = canvas._btAnimOpObjetivo || {};
      const BD = global.BancoDoc;
      if (BD) {
        BD.dibujarArbol(canvas, canvas._btRaiz, Object.assign({}, canvas._btOp, { _internoMorph: true }));
      }
      delete canvas._btAnimObjetivo;
      delete canvas._btAnimOpObjetivo;
    }
  }

  function resetEstado(canvas) {
    cancelar(canvas);
    if (!canvas) return;
    canvas._btRaiz = null;
    canvas._btOp = null;
    limpiarEstableCanvas(canvas);
  }

  function mismaEstructura(raizA, raizB) {
    if (!raizA && !raizB) return true;
    if (!raizA || !raizB || !global.BancoSerial) return false;
    const BS = global.BancoSerial;
    return (
      JSON.stringify(BS.serializarArbol(raizA)) ===
      JSON.stringify(BS.serializarArbol(raizB))
    );
  }

  function mezclarOpPunteros(opA, opB, t) {
    const te = easeInOut(t);
    const resaltarAlpha = {};
    const todos = new Set();
    (opA.resaltar || []).forEach((c) => todos.add(Number(c)));
    (opB.resaltar || []).forEach((c) => todos.add(Number(c)));
    const setA = new Set((opA.resaltar || []).map(Number));
    const setB = new Set((opB.resaltar || []).map(Number));
    todos.forEach((c) => {
      const a = setA.has(c) ? 1 - te : 0;
      const b = setB.has(c) ? te : 0;
      resaltarAlpha[c] = Math.min(1, a + b);
    });
    return Object.assign({}, opB, {
      resaltar: [...todos].filter((c) => resaltarAlpha[c] > 0.04),
      resaltarAlpha,
      intensidadOverlays: te,
      puntero: te < 0.5 ? opA.puntero : opB.puntero,
      punteroPadre: te < 0.5 ? opA.punteroPadre : opB.punteroPadre,
      punteroDir: te < 0.5 ? opA.punteroDir : opB.punteroDir,
      punteroLabel: te < 0.5 ? opA.punteroLabel : opB.punteroLabel,
      pivot: te < 0.5 ? opA.pivot : opB.pivot,
      busqueda: opB.busqueda != null ? opB.busqueda : opA.busqueda,
      punteroEsNulo: te < 0.5 ? opA.punteroEsNulo : opB.punteroEsNulo,
    });
  }

  function dibujarDirecto(canvas, raiz, op) {
    const BD = global.BancoDoc;
    if (!BD) return;
    BD.dibujarArbol(canvas, raiz, Object.assign({}, op || {}, { _internoMorph: true }));
  }

  function animarFundidoPunteros(canvas, raiz, opAnterior, opNuevo, alTerminar) {
    cancelar(canvas);
    const altura = alturaLogicaArbol(raiz);
    canvas.dataset.alturaLogica = String(altura);
    const t0 = performance.now();

    canvas._btAnimObjetivo = clonarRaiz(raiz);
    canvas._btAnimOpObjetivo = Object.assign({}, opNuevo);

    function frame(now) {
      if (canvas._rafTransicion == null) return;
      const t = Math.min(1, (now - t0) / DUR_FUNDIDO_MS);
      if (global.BancoCanvas) global.BancoCanvas.preparar(canvas, altura);
      dibujarDirecto(canvas, raiz, mezclarOpPunteros(opAnterior || {}, opNuevo, t));
      if (t < 1) {
        canvas._rafTransicion = requestAnimationFrame(frame);
      } else {
        canvas._rafTransicion = null;
        dibujarDirecto(canvas, raiz, opNuevo);
        const prepF = global.BancoCanvas
          ? global.BancoCanvas.preparar(canvas, altura)
          : null;
        const wF = prepF ? prepF.w : canvas.clientWidth || 400;
        const hF = prepF ? prepF.h : altura;
        guardarPosicionesCanvas(canvas, layoutPosiciones(raiz, wF, hF).pos);
        canvas._btRaiz = clonarRaiz(raiz);
        canvas._btOp = Object.assign({}, opNuevo);
        delete canvas._btAnimObjetivo;
        delete canvas._btAnimOpObjetivo;
        if (alTerminar) alTerminar();
      }
    }

    canvas._rafTransicion = requestAnimationFrame(frame);
  }

  function ejecutarMorph(canvas, raizAnterior, raizNuevo, op, opAnterior, alTerminar) {
    const altura = alturaLogicaArbol(raizNuevo || raizAnterior);
    canvas.dataset.alturaLogica = String(altura);

    const prep = global.BancoCanvas
      ? global.BancoCanvas.preparar(canvas, altura)
      : null;
    const w = prep ? prep.w : canvas.clientWidth || 400;
    const h = prep ? prep.h : altura;

    const escena = prepararEscena(raizAnterior, raizNuevo, w, h, canvas);

    if (soloCambianApariencia(escena)) {
      animarFundidoPunteros(canvas, raizNuevo, opAnterior || {}, op, () => {
        guardarPosicionesCanvas(canvas, escena.posFinal);
        if (alTerminar) alTerminar();
      });
      return;
    }

    const t0 = performance.now();

    canvas._btAnimObjetivo = clonarRaiz(raizNuevo);
    canvas._btAnimOpObjetivo = Object.assign({}, op);

    function frame(now) {
      if (canvas._rafTransicion == null) return;

      const t = Math.min(1, (now - t0) / DUR_MS);
      if (global.BancoCanvas) {
        global.BancoCanvas.preparar(canvas, altura);
      }
      const ctx = canvas.getContext("2d");
      const opFrame = mezclarOpPunteros(opAnterior || {}, op, t);
      dibujarMorphFrame(ctx, escena, t, opFrame);

      if (t < 1) {
        canvas._rafTransicion = requestAnimationFrame(frame);
      } else {
        canvas._rafTransicion = null;
        dibujarDirecto(canvas, raizNuevo, Object.assign({}, op, { intensidadOverlays: 1 }));
        guardarPosicionesCanvas(canvas, escena.posFinal);
        canvas._btRaiz = clonarRaiz(raizNuevo);
        canvas._btOp = Object.assign({}, op);
        delete canvas._btAnimObjetivo;
        delete canvas._btAnimOpObjetivo;
        if (alTerminar) alTerminar();
      }
    }

    canvas._rafTransicion = requestAnimationFrame(frame);
  }

  function animarEntreRaices(canvas, raizAnterior, raizNuevo, opciones, alTerminar, opAnterior) {
    cancelar(canvas);
    const op = opciones || {};

    if (!raizNuevo && !raizAnterior) {
      dibujarDirecto(canvas, null, op);
      canvas._btRaiz = null;
      canvas._btOp = Object.assign({}, op);
      if (alTerminar) alTerminar();
      return;
    }

    if (raizAnterior && raizNuevo && mismaEstructura(raizAnterior, raizNuevo)) {
      animarFundidoPunteros(canvas, raizNuevo, opAnterior || {}, op, () => {
        const altura = parseInt(canvas.dataset.alturaLogica, 10) || 360;
        const prep = global.BancoCanvas
          ? global.BancoCanvas.preparar(canvas, altura)
          : null;
        const w = prep ? prep.w : canvas.clientWidth || 400;
        const h = prep ? prep.h : altura;
        const { pos } = layoutPosiciones(raizNuevo, w, h);
        guardarPosicionesCanvas(canvas, pos);
        if (alTerminar) alTerminar();
      });
      return;
    }

    ejecutarMorph(canvas, raizAnterior, raizNuevo, op, opAnterior || {}, alTerminar);
  }

  function pintarArbol(canvas, raizNuevo, opciones, opts) {
    if (!canvas || !global.BancoDoc) {
      const done = opciones && opciones.alTerminar;
      if (done) done();
      return;
    }
    const op = opciones || {};
    const instant = (opts && opts.instantaneo) || op.instantaneo;
    const alTerminar = (opts && opts.alTerminar) || op.alTerminar;

    function terminar() {
      if (alTerminar) alTerminar();
    }

    if (instant) {
      cancelar(canvas);
      const raizAnt = canvas._btRaiz ?? null;
      const misma =
        raizAnt && raizNuevo && mismaEstructura(raizAnt, raizNuevo);
      if (!misma) limpiarEstableCanvas(canvas);
      dibujarDirecto(canvas, raizNuevo, op);
      canvas._btRaiz = clonarRaiz(raizNuevo);
      canvas._btOp = Object.assign({}, op);
      if (misma && global.BancoCanvas) {
        const altura = parseInt(canvas.dataset.alturaLogica, 10) || 360;
        const prep = global.BancoCanvas.preparar(canvas, altura);
        guardarPosicionesCanvas(canvas, layoutPosiciones(raizNuevo, prep.w, prep.h).pos);
      }
      terminar();
      return;
    }

    const raizAnt = canvas._btRaiz ?? null;
    const opAnt = canvas._btOp || null;
    animarEntreRaices(canvas, raizAnt, raizNuevo, op, terminar, opAnt);
  }

  global.BancoTransicion = {
    DUR_MS,
    cancelar,
    resetEstado,
    limpiarEstableCanvas,
    clonarRaiz,
    layoutPosiciones,
    asignarLayoutANodos,
    vistaEncajar,
    alturaLogicaArbol,
    guardarPosicionesCanvas,
    animarEntreRaices,
    pintarArbol,
    estaAnimando: (canvas) => !!(canvas && canvas._rafTransicion),
  };
})(typeof window !== "undefined" ? window : globalThis);
