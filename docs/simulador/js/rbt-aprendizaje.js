/**
 * Guía RBT: árboles con aristas diagonales (estilo BST) y morph antes → después.
 * Las aristas en “escalera” solo se usan en merge-sort-viz.js (reporte).
 */
(function (global) {
  "use strict";

  const BD = () => global.BancoDoc;
  const NODE_R = 22;
  const MARGEN = { t: 32, b: 28, l: 36, r: 36 };
  const DUR_MORPH_MS = 1100;

  /** @type {Record<string, object|null>} */
  const DIAGRAMAS = {
    "ins-bst": {
      v: 50,
      r: false,
      izq: { v: 30, r: true },
      der: { v: 70, r: true, izq: { v: 60, r: true } },
    },
    "ins-tio-antes": {
      v: 10,
      r: false,
      izq: { v: 5, r: true, izq: { v: 3, r: true } },
      der: { v: 15, r: true },
    },
    "ins-tio-despues": {
      v: 10,
      r: true,
      izq: { v: 5, r: false, izq: { v: 3, r: true } },
      der: { v: 15, r: false },
    },
    "ins-linea-antes": {
      v: 10,
      r: false,
      der: { v: 20, r: true, der: { v: 30, r: true } },
    },
    "ins-linea-despues": {
      v: 20,
      r: false,
      izq: { v: 10, r: true },
      der: { v: 30, r: true },
    },
    "ins-triangulo-antes": {
      v: 30,
      r: false,
      izq: { v: 10, r: true, der: { v: 20, r: true } },
    },
    "ins-triangulo-despues": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: { v: 30, r: false },
    },
    "rot-izq-antes": {
      v: 30,
      r: false,
      der: { v: 50, r: true, izq: { v: 40, r: true } },
    },
    "rot-izq-despues": {
      v: 50,
      r: true,
      izq: { v: 30, r: false, der: { v: 40, r: true } },
    },
    "rot-der-antes": {
      v: 50,
      r: false,
      izq: { v: 30, r: true, der: { v: 40, r: true } },
    },
    "rot-der-despues": {
      v: 30,
      r: true,
      der: { v: 50, r: false, izq: { v: 40, r: true } },
    },
    "del-2hijos": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: { v: 30, r: false, izq: { v: 25, r: true }, der: { v: 35, r: true } },
    },
    "del-herm-rojo-antes": {
      v: 10,
      r: false,
      izq: { v: 5, r: false },
      der: { v: 15, r: true, izq: { v: 12, r: false }, der: { v: 18, r: false } },
    },
    "del-herm-rojo-despues": {
      v: 15,
      r: false,
      izq: { v: 10, r: true, izq: { v: 5, r: false }, der: { v: 12, r: false } },
      der: { v: 18, r: false },
    },
    "del-sobrinos-negros-antes": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: { v: 30, r: true, izq: { v: 25, r: false }, der: { v: 35, r: false } },
    },
    "del-sobrinos-negros-despues": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: { v: 30, r: true },
    },
    "del-sobrino-ext-antes": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: {
        v: 30,
        r: true,
        izq: { v: 25, r: false },
        der: { v: 35, r: true },
      },
    },
    "del-sobrino-ext-despues": {
      v: 30,
      r: false,
      izq: { v: 20, r: false, izq: { v: 10, r: false } },
      der: { v: 35, r: false },
    },
    "del-padre-rojo-antes": {
      v: 20,
      r: true,
      izq: { v: 10, r: false },
      der: { v: 30, r: false, izq: { v: 25, r: false }, der: { v: 35, r: false } },
    },
    "del-padre-rojo-despues": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: { v: 30, r: true },
    },
    "del-sobrino-int-antes": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: {
        v: 30,
        r: true,
        izq: { v: 25, r: true },
        der: { v: 35, r: false },
      },
    },
    "del-sobrino-int-despues": {
      v: 20,
      r: false,
      izq: { v: 10, r: false },
      der: {
        v: 25,
        r: true,
        der: { v: 30, r: true, der: { v: 35, r: false } },
      },
    },
  };

  const RESALTAR = {
    "ins-tio-antes": [3, 5, 15, 10],
    "ins-tio-despues": [3, 10],
    "ins-linea-antes": [10, 20, 30],
    "ins-linea-despues": [10, 20, 30],
    "ins-triangulo-antes": [10, 20, 30],
    "ins-triangulo-despues": [10, 20, 30],
    "rot-izq-antes": [30, 40, 50],
    "rot-izq-despues": [30, 40, 50],
    "rot-der-antes": [30, 40, 50],
    "rot-der-despues": [30, 40, 50],
    "del-2hijos": [20, 25],
    "del-herm-rojo-antes": [5, 15],
    "del-sobrinos-negros-antes": [10, 25, 35, 30],
    "del-sobrino-ext-antes": [10, 35],
    "del-padre-rojo-antes": [10, 20, 30],
    "del-sobrino-int-antes": [10, 25, 30],
  };

  /** Chips en diagramas Antes/Después (comparadores y diagrama solo). */
  const ROLES_DIAGRAMA = {
    "ins-tio-antes": [
      { cuenta: 10, label: "A abuelo", color: "#94a3b8", ox: -44 },
      { cuenta: 5, label: "P padre", color: "#94a3b8", ox: 44 },
      { cuenta: 15, label: "T tío", color: "#f472b6", ox: 0 },
      { cuenta: 3, label: "N nuevo", color: "#fbbf24", ox: 0 },
    ],
    "ins-tio-despues": [
      { cuenta: 10, label: "A abuelo", color: "#fbbf24", ox: 0 },
      { cuenta: 5, label: "P padre", color: "#94a3b8", ox: -40 },
      { cuenta: 15, label: "T tío", color: "#f472b6", ox: 40 },
    ],
    "ins-triangulo-antes": [
      { cuenta: 30, label: "A abuelo", color: "#94a3b8", ox: 0 },
      { cuenta: 10, label: "P padre", color: "#94a3b8", ox: -48 },
      { cuenta: 20, label: "N nuevo", color: "#fbbf24", ox: 48 },
    ],
    "ins-triangulo-despues": [
      { cuenta: 20, label: "A (raíz)", color: "#94a3b8", ox: 0 },
      { cuenta: 10, label: "P", color: "#94a3b8", ox: -44 },
      { cuenta: 30, label: "N", color: "#fbbf24", ox: 44 },
    ],
    "ins-linea-antes": [
      { cuenta: 10, label: "A abuelo", color: "#94a3b8", ox: -48 },
      { cuenta: 20, label: "P padre", color: "#94a3b8", ox: 0 },
      { cuenta: 30, label: "N nuevo", color: "#fbbf24", ox: 48 },
    ],
    "ins-linea-despues": [
      { cuenta: 20, label: "A (raíz)", color: "#94a3b8", ox: 0 },
      { cuenta: 10, label: "P", color: "#94a3b8", ox: -44 },
      { cuenta: 30, label: "N", color: "#fbbf24", ox: 44 },
    ],
    "rot-izq-antes": [{ cuenta: 30, label: "pivote", color: "#a78bfa", ox: 0 }],
    "rot-izq-despues": [{ cuenta: 50, label: "pivote", color: "#a78bfa", ox: 0 }],
    "rot-der-antes": [{ cuenta: 50, label: "pivote", color: "#a78bfa", ox: 0 }],
    "rot-der-despues": [{ cuenta: 30, label: "pivote", color: "#a78bfa", ox: 0 }],
    "del-2hijos": [
      { cuenta: 20, label: "V a borrar", color: "#fbbf24", ox: 0 },
      { cuenta: 25, label: "sucesor", color: "#22d3ee", ox: 44 },
    ],
    "del-herm-rojo-antes": [
      { cuenta: 10, label: "P padre", color: "#94a3b8", ox: -44 },
      { cuenta: 15, label: "H hermano", color: "#fb923c", ox: 44 },
    ],
    "del-herm-rojo-despues": [
      { cuenta: 15, label: "H hermano", color: "#fb923c", ox: 0 },
      { cuenta: 10, label: "P padre", color: "#94a3b8", ox: -48 },
    ],
    "del-sobrinos-negros-antes": [
      { cuenta: 20, label: "P padre", color: "#94a3b8", ox: -48 },
      { cuenta: 30, label: "H hermano", color: "#fb923c", ox: 0 },
      { cuenta: 25, label: "sobrino", color: "#64748b", ox: -36 },
      { cuenta: 35, label: "sobrino", color: "#64748b", ox: 36 },
    ],
    "del-sobrinos-negros-despues": [
      { cuenta: 20, label: "P (déficit)", color: "#fbbf24", ox: 0 },
      { cuenta: 30, label: "H hermano", color: "#fb923c", ox: 44 },
    ],
    "del-padre-rojo-antes": [
      { cuenta: 20, label: "P padre", color: "#fbbf24", ox: 0 },
      { cuenta: 30, label: "H hermano", color: "#fb923c", ox: 44 },
    ],
    "del-sobrino-int-antes": [
      { cuenta: 30, label: "H hermano", color: "#fb923c", ox: 0 },
      { cuenta: 25, label: "sobrino cercano", color: "#fbbf24", ox: -48 },
    ],
    "del-sobrino-ext-antes": [
      { cuenta: 20, label: "P padre", color: "#94a3b8", ox: -48 },
      { cuenta: 30, label: "H hermano", color: "#fb923c", ox: 0 },
      { cuenta: 35, label: "sobrino lejano", color: "#fbbf24", ox: 48 },
    ],
  };

  function construirArbol(spec) {
    if (!spec) return null;
    const { Cliente, NodoHibrido } = BD();
    function rec(s, padre) {
      const n = new NodoHibrido(new Cliente(s.v, "", "", 0));
      n.esRojo = s.r !== false;
      if (s.r === false) n.esRojo = false;
      n.padre = padre;
      if (s.izq) n.izquierdo = rec(s.izq, n);
      if (s.der) n.derecho = rec(s.der, n);
      return n;
    }
    return rec(spec, null);
  }

  function layoutMini(raiz, w, h) {
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
    const scaleY = maxD > 0 ? (h - MARGEN.t - MARGEN.b) / maxD : 0;
    layout.forEach(({ n, x, y }) => {
      n._px = MARGEN.l + x * (w - MARGEN.l - MARGEN.r);
      n._py = MARGEN.t + y * scaleY;
    });
    return layout;
  }

  function mapaPorCuenta(raiz) {
    const m = new Map();
    function walk(n) {
      if (!n) return;
      m.set(n.getCuenta(), n);
      walk(n.izquierdo);
      walk(n.derecho);
    }
    walk(raiz);
    return m;
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

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function snap(n) {
    return Math.round(n);
  }

  /** Arista diagonal típica de árbol (no escalera — eso es solo MergeSort). */
  function dibujarAristaArbol(ctx, x1, y1, x2, y2, alpha) {
    if (alpha < 0.04) return;
    const y0 = y1 + NODE_R;
    const yT = y2 - NODE_R;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y0);
    ctx.lineTo(x2, yT);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarNodoEn(ctx, x, y, cuenta, esRojo, resaltar, alpha) {
    if (alpha < 0.04) return;
    const px = snap(x);
    const py = snap(y);
    const esRes = resaltar.has(cuenta);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (esRes) {
      ctx.beginPath();
      ctx.arc(px, py, NODE_R + 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56, 189, 248, 0.28)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(px, py, NODE_R, 0, Math.PI * 2);
    ctx.fillStyle = esRojo ? "#7f1d1d" : "#1e293b";
    ctx.fill();
    ctx.strokeStyle = esRojo ? "#ef4444" : "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(cuenta), px, py);
    ctx.restore();
  }

  function prepararEscena(idAntes, idDespues, w, h) {
    const raizA = construirArbol(DIAGRAMAS[idAntes]);
    const raizD = construirArbol(DIAGRAMAS[idDespues]);
    layoutMini(raizA, w, h);
    layoutMini(raizD, w, h);

    const mapA = mapaPorCuenta(raizA);
    const mapD = mapaPorCuenta(raizD);
    const cuentas = new Set([...mapA.keys(), ...mapD.keys()]);
    const nodos = [];

    cuentas.forEach((cuenta) => {
      const a = mapA.get(cuenta);
      const d = mapD.get(cuenta);
      nodos.push({
        cuenta,
        x0: a ? a._px : d._px,
        y0: a ? a._py : d._py,
        x1: d ? d._px : a._px,
        y1: d ? d._py : a._py,
        rojo0: a ? a.esRojo : d.esRojo,
        rojo1: d ? d.esRojo : a.esRojo,
        soloA: !d,
        soloD: !a,
      });
    });

    return {
      nodos,
      aristasA: listarAristas(raizA),
      aristasD: listarAristas(raizD),
      resaltar: new Set([
        ...(RESALTAR[idAntes] || []),
        ...(RESALTAR[idDespues] || []),
      ].map(Number)),
    };
  }

  function posEnT(n, t) {
    const te = easeInOut(t);
    let alpha = 1;
    if (n.soloA) alpha = 1 - te;
    else if (n.soloD) alpha = te;
    return {
      x: n.x0 + (n.x1 - n.x0) * te,
      y: n.y0 + (n.y1 - n.y0) * te,
      rojo: te < 0.5 ? n.rojo0 : n.rojo1,
      alpha,
    };
  }

  function dibujarMorphFrame(ctx, escena, t) {
    const pos = new Map();
    escena.nodos.forEach((n) => pos.set(n.cuenta, posEnT(n, t)));

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const te = easeInOut(t);
    escena.aristasA.forEach(([p, h]) => {
      const a = pos.get(p);
      const b = pos.get(h);
      if (a && b) dibujarAristaArbol(ctx, a.x, a.y, b.x, b.y, 1 - te);
    });
    escena.aristasD.forEach(([p, h]) => {
      const a = pos.get(p);
      const b = pos.get(h);
      if (a && b) dibujarAristaArbol(ctx, a.x, a.y, b.x, b.y, te);
    });

    escena.nodos.forEach((n) => {
      const p = pos.get(n.cuenta);
      dibujarNodoEn(ctx, p.x, p.y, n.cuenta, p.rojo, escena.resaltar, p.alpha);
    });
  }

  function prepararCanvas(canvas) {
    const altura = parseInt(canvas.getAttribute("data-altura"), 10) || 220;
    canvas.dataset.alturaLogica = String(altura);
    const prep = global.BancoCanvas
      ? global.BancoCanvas.preparar(canvas, altura)
      : null;
    return {
      ctx: canvas.getContext("2d"),
      w: prep ? prep.w : canvas.clientWidth || 320,
      h: prep ? prep.h : altura,
    };
  }

  function dibujarArbolMini(canvas, idDiagrama) {
    if (!canvas || !idDiagrama) return;
    const BV = global.BancoVisualUnificado;
    if (BV && global.gsap) {
      BV.pintarDiagrama(canvas, idDiagrama, { modo: "arbol" });
      return;
    }
    const spec = DIAGRAMAS[idDiagrama];
    const { ctx, w, h } = prepararCanvas(canvas);

    if (!spec) {
      ctx.fillStyle = "#64748b";
      ctx.font = "13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("(sin diagrama)", w / 2, h / 2);
      return;
    }

    const raiz = construirArbol(spec);
    const layout = layoutMini(raiz, w, h);
    const resaltar = new Set((RESALTAR[idDiagrama] || []).map(Number));

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    layout.forEach(({ n }) => {
      if (n.izquierdo) {
        dibujarAristaArbol(ctx, n._px, n._py, n.izquierdo._px, n.izquierdo._py, 1);
      }
      if (n.derecho) {
        dibujarAristaArbol(ctx, n._px, n._py, n.derecho._px, n.derecho._py, 1);
      }
    });

    layout.forEach(({ n }) => {
      dibujarNodoEn(ctx, n._px, n._py, n.getCuenta(), n.esRojo, resaltar, 1);
    });
  }

  function animarMorph(canvas, idAntes, idDespues, alTerminar) {
    if (canvas._rafMorph) {
      cancelAnimationFrame(canvas._rafMorph);
      canvas._rafMorph = null;
    }
    const BV = global.BancoVisualUnificado;
    if (BV && global.gsap) {
      return BV.morphDiagrama(canvas, idAntes, idDespues, alTerminar);
    }
    const escena = prepararEscena(idAntes, idDespues, prepararCanvas(canvas).w, prepararCanvas(canvas).h);
    const t0 = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - t0) / DUR_MORPH_MS);
      global.BancoCanvas.preparar(canvas, parseInt(canvas.dataset.alturaLogica, 10) || 220);
      dibujarMorphFrame(canvas.getContext("2d"), escena, t);
      if (t < 1) {
        canvas._rafMorph = requestAnimationFrame(frame);
      } else {
        canvas._rafMorph = null;
        if (alTerminar) alTerminar();
      }
    }

    canvas._rafMorph = requestAnimationFrame(frame);
  }

  function initComparador(el) {
    const canvas = el.querySelector(".rbt-comparador-canvas");
    const idAntes = el.getAttribute("data-antes");
    const idDespues = el.getAttribute("data-despues");
    const leyenda = el.querySelector(".rbt-comparador-leyenda");
    const textos = {
      antes: el.getAttribute("data-texto-antes") || "Estado inicial",
      despues: el.getAttribute("data-texto-despues") || "Tras aplicar el caso",
      animar: el.getAttribute("data-texto-animar") || "Transición al estado final",
    };

    if (!canvas || !idAntes || !idDespues) return;

    let modo = "antes";

    function pararAnim() {
      if (canvas._rafMorph) {
        cancelAnimationFrame(canvas._rafMorph);
        canvas._rafMorph = null;
      }
      el.classList.remove("animando");
    }

    function pintar(m) {
      pararAnim();
      modo = m;
      dibujarArbolMini(canvas, m === "antes" ? idAntes : idDespues);
      if (leyenda) leyenda.textContent = textos[m] || "";
      el.querySelectorAll("[data-modo]").forEach((btn) => {
        const act = btn.getAttribute("data-modo") === m;
        btn.classList.toggle("activo", act);
        btn.disabled = false;
      });
    }

    function setAnimandoUI() {
      el.classList.add("animando");
      if (leyenda) leyenda.textContent = textos.animar;
      el.querySelectorAll("[data-modo]").forEach((btn) => {
        const modoBtn = btn.getAttribute("data-modo");
        btn.classList.toggle("activo", modoBtn === "animar");
        if (modoBtn !== "animar" && modoBtn !== "pasos") btn.disabled = true;
      });
    }

    pintar("antes");

    el.querySelectorAll("[data-modo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const m = btn.getAttribute("data-modo");
        if (m === "pasos") {
          const casoDel = el.getAttribute("data-caso-eliminar");
          if (casoDel && CASOS_ELIMINAR[casoDel]) {
            const c = CASOS_ELIMINAR[casoDel];
            cargarPasoAPaso({
              tipo: "eliminar",
              insertar: c.insertar,
              eliminar: c.eliminar,
              titulo: c.titulo,
              pasosModo: "eliminar",
            });
          } else {
            const seq = el.getAttribute("data-secuencia");
            if (seq) {
              cargarPasoAPaso({
                secuencia: seq,
                titulo: el.getAttribute("data-titulo-caso") || "Caso RBT",
                pasosModo: el.getAttribute("data-pasos") || "ultima",
              });
            }
          }
          return;
        }
        if (m === "animar") {
          pararAnim();
          setAnimandoUI();
          dibujarArbolMini(canvas, idAntes);
          requestAnimationFrame(() => {
            animarMorph(canvas, idAntes, idDespues, () => {
              pararAnim();
              pintar("despues");
            });
          });
        } else {
          pintar(m);
        }
      });
    });

    if (global.BancoCanvas) {
      const alt = parseInt(canvas.getAttribute("data-altura"), 10) || 220;
      BancoCanvas.observar(canvas, () => {
        if (canvas._rafMorph) return;
        const st = global.BancoVisualUnificado && global.BancoVisualUnificado.obtener(canvas);
        if (st && st.morphActivo) return;
        dibujarArbolMini(canvas, modo === "antes" ? idAntes : idDespues);
      }, alt);
    }
    if (global.BancoVisualUnificado && global.gsap) {
      global.BancoVisualUnificado.init(canvas, {
        modo: "arbol",
        alturaLogica: parseInt(canvas.getAttribute("data-altura"), 10) || 220,
        diagramaMini: true,
      });
    }
  }

  let panelPasosListo = false;
  let reproductorPasos = null;
  let ultimoPasoPasos = null;

  function parseSecuencia(txt) {
    return txt
      .split(/[,;\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }

  const CASOS_ELIMINAR = {
    "del-2hijos": { insertar: "20, 10, 30, 25, 35", eliminar: 20, titulo: "Dos hijos → sucesor" },
    "del-raiz": { insertar: "10, 5, 15", eliminar: 5, titulo: "Caso 1: doble negro en raíz" },
    "del-herm-rojo": { insertar: "10, 5, 15, 12, 18", eliminar: 5, titulo: "Caso 2: hermano rojo" },
    "del-sobrinos-negros": { insertar: "20, 10, 30, 25, 35", eliminar: 10, titulo: "Caso 3: sobrinos negros, padre negro" },
    "del-padre-rojo": { insertar: "15, 10, 20, 5", eliminar: 5, titulo: "Caso 4: sobrinos negros, padre rojo" },
    "del-sobrino-int": { insertar: "20, 10, 30, 25", eliminar: 10, titulo: "Caso 5: sobrino cercano rojo" },
    "del-sobrino-ext": { insertar: "20, 10, 30, 25, 35", eliminar: 10, titulo: "Caso 6: sobrino lejano rojo" },
  };

  function filtrarPasos(pasos, modo) {
    if (!pasos.length || modo === "completa") return pasos;
    if (modo === "eliminar") {
      let idx = 0;
      pasos.forEach((p, i) => {
        if (/Eliminar cuenta|Buscar nodo a eliminar/i.test(p.titulo || "")) idx = i;
      });
      return pasos.slice(Math.max(0, idx));
    }
    let idxInsertar = 0;
    pasos.forEach((p, i) => {
      if (/Insertar valor/i.test(p.titulo || "")) idxInsertar = i;
    });
    return pasos.slice(idxInsertar);
  }

  function initPanelPasoAPaso() {
    if (panelPasosListo && reproductorPasos) return true;
    const panel = document.getElementById("panel-paso-a-paso");
    const canvas = document.getElementById("canvasPasosRbt");
    const contRep = document.getElementById("reproductor-pasos");
    if (!panel || !canvas || !contRep || !global.ReproductorVisual || !global.BancoAnim) {
      return false;
    }

    const ui = { canvas, modo: "arbol", hashEl: null, listaEl: null };

    if (global.BancoVisualUnificado) {
      global.BancoVisualUnificado.init(canvas, { modo: "arbol", alturaLogica: 380 });
    }

    reproductorPasos = new ReproductorVisual({
      contenedor: contRep,
      alPaso: (paso, _i, opts) => {
        ultimoPasoPasos = paso;
        const prom = global.BancoVista.aplicarPaso(paso, ui, opts);
        return prom && typeof prom.then === "function" ? prom : Promise.resolve();
      },
    });

    panelPasosListo = true;
    return true;
  }

  function cargarPasoAPaso(opciones) {
    const panel = document.getElementById("panel-paso-a-paso");
    const subt = document.getElementById("rbt-pasos-subtitulo");

    if (!initPanelPasoAPaso() || !reproductorPasos) {
      if (subt) subt.textContent = "No se pudo iniciar el reproductor (recarga la página).";
      return;
    }

    if (panel) {
      if (panel.tagName === "DETAILS") panel.open = true;
      panel.classList.add("activo");
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const ui = { canvas: document.getElementById("canvasPasosRbt"), modo: "arbol" };
    if (global.BancoVisualUnificado && ui.canvas) {
      global.BancoVisualUnificado.matarTimeline(ui.canvas);
    }
    reproductorPasos.pausar();
    let pasos;

    if (opciones.tipo === "eliminar") {
      const ins = parseSecuencia(opciones.insertar || "");
      const del = parseInt(String(opciones.eliminar).trim(), 10);
      if (!ins.length || isNaN(del)) {
        if (subt) subt.textContent = "Error: secuencia de inserción o cuenta a eliminar inválida.";
        return;
      }
      if (subt) {
        subt.textContent =
          (opciones.titulo || "Eliminar") +
          " — insertar: " +
          ins.join(", ") +
          " → eliminar " +
          del +
          " (punteros y corregirEliminacion)";
      }
      const r = global.BancoAnim.animarSoloEliminarRBT(ins, del);
      pasos = filtrarPasos(r.pasos || [], "eliminar");
    } else {
      const nums = parseSecuencia(opciones.secuencia || "");
      if (!nums.length) {
        if (subt) subt.textContent = "Error: escribe al menos un número en la secuencia.";
        return;
      }
      if (subt) {
        subt.textContent =
          (opciones.titulo || "Caso") +
          " — secuencia: " +
          nums.join(", ") +
          " (punteros, BST y balanceo como en el simulador)";
      }
      const r = global.BancoAnim.animarSoloRBT(nums);
      pasos = filtrarPasos(r.pasos || [], opciones.pasosModo || "ultima");
    }
    if (!pasos.length) {
      if (subt) subt.textContent = "No se generaron pasos para esta animación.";
      return;
    }
    reproductorPasos
      .cargarPasos(pasos, { instantaneo: true })
      .then(() => {
        if (subt) {
          subt.textContent =
            (opciones.titulo || "Animación") +
            " — " +
            pasos.length +
            " pasos. Reproduciendo… (usa ⏸ o la barra)";
        }
        reproductorPasos.reproducir();
      })
      .catch((err) => {
        console.error("Paso a paso:", err);
        if (subt) {
          subt.textContent =
            "Error al cargar la animación. Prueba recargar (F5) o abre la consola (F12).";
        }
      });
  }

  function initBotonesPasoAPaso() {
    document.querySelectorAll(".rbt-btn-pasos").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        initPanelPasoAPaso();
        const casoDel = btn.getAttribute("data-caso-eliminar");
        if (casoDel && CASOS_ELIMINAR[casoDel]) {
          const c = CASOS_ELIMINAR[casoDel];
          cargarPasoAPaso({
            tipo: "eliminar",
            insertar: c.insertar,
            eliminar: c.eliminar,
            titulo: c.titulo,
            pasosModo: "eliminar",
          });
        } else {
          cargarPasoAPaso({
            secuencia: btn.getAttribute("data-secuencia") || "",
            titulo: btn.getAttribute("data-titulo-caso") || "",
            pasosModo: btn.getAttribute("data-pasos") || "completa",
          });
        }
      });
    });
  }

  function initPaginaCasos() {
    initPanelPasoAPaso();
    initBotonesPasoAPaso();
    document.querySelectorAll(".rbt-comparador").forEach(initComparador);

    document.querySelectorAll("canvas[data-diagram-solo]").forEach((canvas) => {
      const id = canvas.getAttribute("data-diagram-solo");
      const alt = parseInt(canvas.getAttribute("data-altura"), 10) || 220;
      const dibujar = () => dibujarArbolMini(canvas, id);
      if (global.BancoVisualUnificado) {
        global.BancoVisualUnificado.init(canvas, { modo: "arbol", alturaLogica: alt, diagramaMini: true });
      }
      if (typeof IntersectionObserver !== "undefined") {
        const obs = new IntersectionObserver(
          (entries) => {
            if (entries[0] && entries[0].isIntersecting) dibujar();
          },
          { threshold: 0.05 }
        );
        obs.observe(canvas);
        canvas._diagramObs = obs;
      } else {
        dibujar();
      }
      if (global.BancoCanvas) {
        BancoCanvas.observar(canvas, dibujar, alt);
      }
    });

    document.querySelectorAll("details.rbt-grupo").forEach((grupo) => {
      grupo.addEventListener("toggle", () => {
        if (!grupo.open) return;
        requestAnimationFrame(() => {
          grupo.querySelectorAll(".rbt-comparador").forEach((c) => {
            const btn = c.querySelector('[data-modo="antes"]');
            if (btn) btn.click();
          });
          grupo.querySelectorAll("canvas[data-diagram-solo]").forEach((canvas) => {
            dibujarArbolMini(canvas, canvas.getAttribute("data-diagram-solo"));
          });
        });
      });
    });
  }

  global.RbtAprendizaje = {
    DIAGRAMAS,
    RESALTAR,
    ROLES_DIAGRAMA,
    construirArbol,
    dibujarArbolMini,
    animarMorph,
    cargarPasoAPaso,
    initPaginaCasos,
  };
})(typeof window !== "undefined" ? window : globalThis);
