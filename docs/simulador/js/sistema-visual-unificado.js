/**
 * Capa visual unificada: un solo canvas, grafo de escena con IDs estables y GSAP.
 * La lógica de pasos (motor-animacion / reproductor) no se modifica aquí.
 */
(function (global) {
  "use strict";

  const NODE_R = 26;
  const NODE_R_MINI = 22;
  const DUR = 0.38;
  const DUR_SALIDA = 0.22;
  const DUR_MORPH_DIAG = 1.1;
  const PAD = 14;
  const HASH_COL_W = 156;
  const COL_GAP = 12;
  const MERGE_H_MIN = 160;
  const LISTA_H = 80;
  const ARBOL_H_MIN = 220;
  const ALTURA_LOGICA_DEF = 720;

  /** @type {Map<HTMLCanvasElement, object>} */
  const porCanvas = new Map();
  let tickerActivo = false;

  let canvasEl = null;
  let ctx = null;
  let logW = 0;
  let logH = ALTURA_LOGICA_DEF;
  let dpr = 1;
  let timeline = null;
  let pasoActual = null;
  let escena = { nodos: new Map(), aristas: [] };
  let opArbolActual = {};
  let modoActual = "completo";
  let estadoInterno = { hashKey: "", balde: 0, tamano: 7, onBaldeClick: null };

  function crearEstado(canvas, op) {
    const altura =
      (op && op.alturaLogica) ||
      parseInt(canvas.dataset.alturaLogica, 10) ||
      ALTURA_LOGICA_DEF;
    return {
      canvas,
      escena: { nodos: new Map(), aristas: [] },
      timeline: null,
      pasoActual: null,
      logH: altura,
      modo: (op && op.modo) || "completo",
      hashKey: "",
      balde: 0,
      tamano: (op && op.tamano) || 7,
      onBaldeClick: (op && op.onBaldeClick) || null,
      morphActivo: false,
      diagramaMini: !!(op && op.diagramaMini),
      resizeObs: null,
      clickBound: false,
      wheelBound: false,
      listaScrollX: 0,
      listaMaxScroll: 0,
      listaIdsKey: "",
    };
  }

  function ensureEstado(canvas, op) {
    if (!canvas) return null;
    if (!porCanvas.has(canvas)) {
      porCanvas.set(canvas, crearEstado(canvas, op));
      enlazarCanvas(canvas, porCanvas.get(canvas));
    }
    const st = porCanvas.get(canvas);
    if (op) {
      if (op.modo) st.modo = op.modo;
      if (op.tamano) st.tamano = op.tamano;
      if (op.alturaLogica) {
        st.logH = op.alturaLogica;
        canvas.dataset.alturaLogica = String(op.alturaLogica);
      }
      if (op.onBaldeClick) st.onBaldeClick = op.onBaldeClick;
      if (op.diagramaMini != null) st.diagramaMini = !!op.diagramaMini;
    }
    return st;
  }

  function bindEstado(st) {
    if (!st) return;
    canvasEl = st.canvas;
    escena = st.escena;
    timeline = st.timeline;
    pasoActual = st.pasoActual;
    logH = st.logH;
    modoActual = st.modo;
    estadoInterno = {
      hashKey: st.hashKey,
      balde: st.balde,
      tamano: st.tamano,
      onBaldeClick: st.onBaldeClick,
    };
  }

  function syncEstado(st) {
    if (!st) return;
    st.timeline = timeline;
    st.pasoActual = pasoActual;
    st.hashKey = estadoInterno.hashKey;
    st.balde = estadoInterno.balde;
    st.tamano = estadoInterno.tamano;
  }

  function gsapDisponible() {
    return typeof global.gsap !== "undefined";
  }

  function matarTimeline(canvas) {
    const matarEn = (st) => {
      if (!st || !st.timeline) return;
      st.timeline.kill();
      st.timeline = null;
      if (canvasEl === st.canvas) timeline = null;
    };
    if (canvas) {
      matarEn(porCanvas.get(canvas));
      return;
    }
    if (timeline) {
      timeline.kill();
      timeline = null;
    }
    porCanvas.forEach(matarEn);
  }

  function obtener(canvas) {
    return porCanvas.get(canvas) || null;
  }

  function obtenerDpr() {
    if (global.BancoCanvas && global.BancoCanvas.obtenerDpr) {
      return global.BancoCanvas.obtenerDpr();
    }
    return Math.min(Math.max(global.devicePixelRatio || 1, 1), 3);
  }

  function prepararCanvas() {
    if (!canvasEl) return;
    const padre = canvasEl.parentElement;
    const rect = canvasEl.getBoundingClientRect();
    const anchoPadre = padre ? padre.clientWidth : 0;
    const ancho =
      rect.width > 0
        ? rect.width
        : anchoPadre > 0
          ? Math.max(320, anchoPadre - 4)
          : Math.max(320, canvasEl.clientWidth || 900);

    logW = ancho;
    dpr = obtenerDpr();
    canvasEl._logW = logW;
    canvasEl._logH = logH;
    canvasEl._dpr = dpr;
    canvasEl.style.width = logW + "px";
    canvasEl.style.height = logH + "px";
    canvasEl.style.maxWidth = "100%";

    const pxW = Math.round(logW * dpr);
    const pxH = Math.round(logH * dpr);
    if (canvasEl.width !== pxW || canvasEl.height !== pxH) {
      canvasEl.width = pxW;
      canvasEl.height = pxH;
    }

    ctx = canvasEl.getContext("2d", { alpha: true });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) {
      ctx.imageSmoothingQuality = "high";
    }
  }

  function registrarTicker() {
    if (tickerActivo) return;
    if (gsapDisponible()) {
      global.gsap.ticker.add(renderLoop);
    } else {
      let raf;
      const loop = () => {
        renderLoop();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    tickerActivo = true;
  }

  /**
   * completo: hash izq | árbol + merge der; lista ancho completo abajo
   * arbol: solo RBT
   * merge: solo árbol de recursión
   * merge-lista: merge arriba + lista abajo
   */
  function zonas(w, h, opts, modo) {
    const op = opts || {};
    const m = modo || "completo";
    const tituloH = 20;
    const y0 = PAD + tituloH;
    const altoUtil = h - y0 - PAD;
    const gap = 8;
    const listaH = LISTA_H;
    const full = {
      x: PAD,
      y: y0,
      w: w - PAD * 2,
      h: altoUtil,
    };

    if (m === "arbol") {
      if (op.mini) {
        return {
          hash: null,
          arbol: { x: PAD, y: PAD, w: w - PAD * 2, h: h - PAD * 2 },
          merge: null,
          lista: null,
        };
      }
      return {
        hash: null,
        arbol: { ...full, titulo: "Árbol rojo-negro" },
        merge: null,
        lista: null,
      };
    }

    if (m === "merge") {
      return {
        hash: null,
        arbol: null,
        merge: { ...full, titulo: "MergeSort — recursión" },
        lista: null,
      };
    }

    if (m === "merge-lista") {
      const listaH2 = Math.max(64, Math.round(altoUtil * 0.22));
      const mergeH2 = altoUtil - listaH2 - gap;
      return {
        hash: null,
        arbol: null,
        merge: { x: PAD, y: y0, w: w - PAD * 2, h: mergeH2, titulo: "MergeSort — recursión" },
        lista: {
          x: PAD,
          y: y0 + mergeH2 + gap,
          w: w - PAD * 2,
          h: listaH2,
          titulo: "Lista enlazada (siguiente)",
        },
      };
    }

    const listaH2 = Math.max(LISTA_H, Math.round(altoUtil * 0.14));
    const altoSuperior = altoUtil - listaH2 - gap;
    const hashW = Math.min(HASH_COL_W, Math.max(128, Math.round(w * 0.2)));
    const derX = PAD + hashW + COL_GAP;
    const derW = Math.max(200, w - derX - PAD);
    let mergeH = Math.max(MERGE_H_MIN, Math.round(altoSuperior * 0.42));
    let arbolH = Math.max(ARBOL_H_MIN, altoSuperior - mergeH - gap);
    if (op.compactarArbol) {
      arbolH = Math.min(100, Math.round(altoSuperior * 0.18));
      mergeH = altoSuperior - arbolH - gap;
    }

    const yDer = y0;
    const yMerge = yDer + arbolH + gap;
    const yLista = y0 + altoSuperior + gap;

    return {
      hash: {
        x: PAD,
        y: y0,
        w: hashW,
        h: altoSuperior,
        titulo: "Tabla hash",
        vertical: true,
      },
      arbol: {
        x: derX,
        y: yDer,
        w: derW,
        h: arbolH,
        titulo: "Árbol del balde",
      },
      merge: {
        x: derX,
        y: yMerge,
        w: derW,
        h: mergeH,
        titulo: "Reporte — MergeSort",
      },
      lista: {
        x: PAD,
        y: yLista,
        w: w - PAD * 2,
        h: listaH2,
        titulo: "Lista enlazada (siguiente)",
      },
    };
  }

  function idHash(i) {
    return "hash:" + i;
  }
  function idArbol(cuenta) {
    return "arbol:" + cuenta;
  }
  function idLista(cuenta) {
    return "lista:" + cuenta;
  }
  function idMerge(nid) {
    return "merge:" + nid;
  }

  function crearNodoVisual(props) {
    return Object.assign(
      {
        x: props.x ?? 0,
        y: props.y ?? 0,
        alpha: props.alpha ?? 1,
        radius: 26,
        width: 56,
        height: 36,
        forma: "circulo",
        label: "",
        sublabel: "",
        fill: "#1e293b",
        stroke: "#94a3b8",
        lineWidth: 2,
        resaltado: false,
        esRojo: false,
        capa: "arbol",
        valores: null,
        mergeEstado: null,
        activo: false,
        puntero: false,
        pivot: false,
        clave: false,
      },
      props
    );
  }

  function cuentasMuestraArbol(raiz, lim) {
    const out = [];
    function walk(n) {
      if (!n || out.length >= lim) return;
      walk(n.izquierdo);
      if (out.length < lim) out.push(n.getCuenta());
      walk(n.derecho);
    }
    walk(raiz);
    return out;
  }

  function layoutHash(casilleros, hashIdx, zona) {
    const nodos = new Map();
    const n = casilleros.length;
    const gap = 8;
    const celW = zona.w - 8;
    const celH = Math.max(56, Math.min(82, (zona.h - gap * (n - 1) - 16) / Math.max(n, 1)));
    const cx = zona.x + zona.w / 2;
    const stackH = n * celH + Math.max(0, n - 1) * gap;
    let y = zona.y + Math.max(8, (zona.h - stackH) / 2);

    for (let i = 0; i < n; i++) {
      const raiz = casilleros[i];
      const cnt = raiz && global.BancoDoc ? global.BancoDoc.contar(raiz) : 0;
      const cy = y + celH / 2;
      y += celH + gap;
      const activo = i === hashIdx;
      const cuentas = raiz ? cuentasMuestraArbol(raiz, 3) : [];
      let hint = "Sin datos";
      if (cnt === 1) hint = "Cuenta " + cuentas[0];
      else if (cnt > 1) {
        hint =
          cuentas.length >= 2
            ? cuentas.slice(0, 2).join(" · ") + (cnt > 2 ? " …" : "")
            : "Raíz " + raiz.getCuenta();
      }
      nodos.set(
        idHash(i),
        crearNodoVisual({
          id: idHash(i),
          capa: "hash",
          forma: "hash-celda",
          x: cx,
          y: cy,
          width: celW,
          height: celH - 4,
          label: String(i),
          sublabel: cnt ? cnt + (cnt === 1 ? " nodo" : " nodos") : "vacío",
          hint,
          cuentas,
          cnt,
          fill: activo ? "#1e3a5f" : cnt ? "#1a2332" : "#121a26",
          stroke: activo ? "#38bdf8" : cnt ? "#475569" : "#2d3a4f",
          lineWidth: activo ? 3 : 1.5,
          resaltado: activo,
          hashIdx: i,
        })
      );
    }
    return nodos;
  }

  function layoutArbol(raiz, zona, op) {
    const nodos = new Map();
    const aristas = [];
    if (!raiz || !global.BancoTransicion) return { nodos, aristas, op };

    const BT = global.BancoTransicion;
    const { pos, aristas: ars } = BT.layoutPosiciones(raiz, zona.w, zona.h);
    const pad = 20;
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    pos.forEach((p) => {
      bounds.minX = Math.min(bounds.minX, p.x - NODE_R);
      bounds.maxX = Math.max(bounds.maxX, p.x + NODE_R);
      bounds.minY = Math.min(bounds.minY, p.y - NODE_R);
      bounds.maxY = Math.max(bounds.maxY, p.y + NODE_R);
    });
    if (!isFinite(bounds.minX)) {
      bounds.minX = 0;
      bounds.maxX = zona.w;
      bounds.minY = 0;
      bounds.maxY = zona.h;
    }
    const vista = BT.vistaEncajar(zona.w, zona.h, bounds, pad);

    const resaltar = new Set((op.resaltar || []).map(Number));
    const puntero = op.puntero != null ? Number(op.puntero) : null;
    const pivot = op.pivot != null ? Number(op.pivot) : null;
    const busqueda = op.busqueda != null ? Number(op.busqueda) : op.cursor != null ? Number(op.cursor) : null;

    const radio = NODE_R * vista.scale;

    pos.forEach((p, cuenta) => {
      const tx = zona.x + p.x * vista.scale + vista.tx;
      const ty = zona.y + p.y * vista.scale + vista.ty;
      const esCur = puntero === cuenta;
      const esPiv = pivot === cuenta;
      const esClave = busqueda === cuenta && !esCur;
      nodos.set(
        idArbol(cuenta),
        crearNodoVisual({
          id: idArbol(cuenta),
          capa: "arbol",
          forma: "circulo",
          x: tx,
          y: ty,
          radius: radio,
          label: String(cuenta),
          esRojo: p.esRojo,
          fill: p.esRojo ? "#7f1d1d" : "#1e293b",
          stroke: esCur ? "#fbbf24" : p.esRojo ? "#ef4444" : "#94a3b8",
          lineWidth: esCur ? 3 : 2,
          resaltado: resaltar.has(cuenta),
          puntero: esCur,
          pivot: esPiv,
          clave: esClave,
          cuenta,
        })
      );
    });

    ars.forEach(([a, b]) => {
      const pa = nodos.get(idArbol(a));
      const pb = nodos.get(idArbol(b));
      if (!pa || !pb) return;
      const c = coordsAristaArbol(pa, pb, radio);
      aristas.push({
        id: "arbol-e:" + a + "-" + b,
        capa: "arbol",
        x1: c.x1,
        y1: c.y1,
        x2: c.x2,
        y2: c.y2,
        color: "#94a3b8",
        width: 2,
      });
    });

    return { nodos, aristas, op };
  }

  function medirLayoutLista(ids, zona, scrollX) {
    const n = ids.length;
    const gap = 8;
    const minBox = 26;
    const maxBox = 64;
    let boxW = n ? (zona.w - gap * (n - 1)) / n : maxBox;
    boxW = Math.min(maxBox, Math.max(minBox, boxW));
    const contentW = n * boxW + Math.max(0, n - 1) * gap;
    const maxScroll = Math.max(0, contentW - zona.w);
    const sx = Math.max(0, Math.min(maxScroll, scrollX || 0));
    return { boxW, gap, contentW, maxScroll, scrollX: sx };
  }

  function sincronizarListaScroll(st, ids, Z) {
    if (!st || !Z || !Z.lista || !ids || !ids.length) {
      if (st) {
        st.listaScrollX = 0;
        st.listaMaxScroll = 0;
        st.listaIdsKey = "";
      }
      return 0;
    }
    const key = ids.join(",");
    if (st.listaIdsKey !== key) {
      st.listaIdsKey = key;
      st.listaScrollX = 0;
    }
    const med = medirLayoutLista(ids, Z.lista, st.listaScrollX);
    st.listaScrollX = med.scrollX;
    st.listaMaxScroll = med.maxScroll;
    return med.scrollX;
  }

  function layoutLista(ids, resaltar, zona, ordenada, scrollX) {
    const nodos = new Map();
    const aristas = [];
    if (!ids || !ids.length) return { nodos, aristas };

    const set = new Set((resaltar || []).map(Number));
    const med = medirLayoutLista(ids, zona, scrollX);
    const { boxW, gap } = med;
    const cy = zona.y + zona.h / 2;
    const x0 = zona.x - med.scrollX;

    ids.forEach((id, i) => {
      const cx = x0 + i * (boxW + gap) + boxW / 2;
      nodos.set(
        idLista(id),
        crearNodoVisual({
          id: idLista(id),
          capa: "lista",
          forma: "rect",
          x: cx,
          y: cy,
          width: boxW,
          height: 40,
          label: String(id),
          fill: set.has(id) ? "#0f766e" : "#1e293b",
          stroke: set.has(id) ? "#34d399" : ordenada ? "#22c55e" : "#64748b",
          lineWidth: set.has(id) ? 2.5 : 2,
          resaltado: set.has(id),
          cuenta: id,
        })
      );
      if (i < ids.length - 1) {
        const x1 = cx + boxW / 2 + 4;
        const x2 = x0 + (i + 1) * (boxW + gap) + boxW / 2 - 4;
        aristas.push({
          id: "lista-e:" + id + "-" + ids[i + 1],
          capa: "lista",
          x1,
          y1: cy,
          x2,
          y2: cy,
          color: "#64748b",
          width: 2,
          flecha: true,
          label: "siguiente",
        });
      }
    });
    return { nodos, aristas };
  }

  /* Layout merge (réplica mínima de merge-sort-viz.js) */
  const MERGE_GAP_H = 34;
  const MERGE_ROW_V = 72;
  const MERGE_PAD_TOP = 12;

  function mergeAnchoNodo(n) {
    const MV = global.BancoMergeViz;
    if (MV && MV.especCeldasMerge) return MV.especCeldasMerge(n.valores.length).width;
    const vals = n.valores;
    return Math.max(52, vals.length * 32 + 14);
  }

  function mergeLayoutSub(n, depth, left) {
    if (!n) return 0;
    const wSelf = mergeAnchoNodo(n);
    n._py = MERGE_PAD_TOP + depth * MERGE_ROW_V;
    if (!n.izq && !n.der) {
      n._px = left + wSelf / 2;
      return wSelf;
    }
    let x = left;
    let wIzq = 0;
    let wDer = 0;
    if (n.izq) {
      wIzq = mergeLayoutSub(n.izq, depth + 1, x);
      x += wIzq;
      if (n.der) x += MERGE_GAP_H;
    }
    if (n.der) wDer = mergeLayoutSub(n.der, depth + 1, x);
    const span = wIzq + (n.izq && n.der ? MERGE_GAP_H : 0) + wDer;
    const total = Math.max(wSelf, span);
    if (n.izq && n.der) n._px = (n.izq._px + n.der._px) / 2;
    else if (n.izq) n._px = n.izq._px;
    else if (n.der) n._px = n.der._px;
    return total;
  }

  function mergeRecoger(n, out) {
    if (!n) return;
    mergeRecoger(n.izq, out);
    out.push(n);
    mergeRecoger(n.der, out);
  }

  function layoutMerge(arbol, zona) {
    const nodos = new Map();
    const aristas = [];
    if (!arbol || !global.BancoMergeViz) return { nodos, aristas };

    const copia = global.BancoMergeViz.clonarArbol(arbol);
    mergeLayoutSub(copia, 0, 24);
    const lista = [];
    mergeRecoger(copia, lista);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    lista.forEach((n) => {
      const hw = mergeAnchoNodo(n) / 2 + 8;
      minX = Math.min(minX, n._px - hw);
      maxX = Math.max(maxX, n._px + hw);
      minY = Math.min(minY, n._py - 20);
      maxY = Math.max(maxY, n._py + 44);
    });
    const bw = Math.max(maxX - minX, 1);
    const bh = Math.max(maxY - minY, 1);
    const pad = 12;
    const scale = Math.min(1, (zona.w - pad * 2) / bw, (zona.h - pad * 2) / bh);
    const tx = zona.x + pad + (zona.w - pad * 2 - bw * scale) / 2 - minX * scale;
    const ty = zona.y + pad + (zona.h - pad * 2 - bh * scale) / 2 - minY * scale;

    const estadosColor = {
      base: "#34d399",
      fusion: "#a5b4fc",
      dividido: "#fbbf24",
      dividiendo: "#fb923c",
      raiz: "#38bdf8",
      activo: "#38bdf8",
    };

    lista.forEach((n) => {
      const cx = tx + n._px * scale;
      const cy = ty + n._py * scale;
      const w = mergeAnchoNodo(n) * scale;
      nodos.set(
        idMerge(n.id),
        crearNodoVisual({
          id: idMerge(n.id),
          capa: "merge",
          forma: "merge-box",
          x: cx,
          y: cy,
          width: w,
          height: 36 * scale,
          label: "",
          valores: n.valores.slice(),
          mergeEstado: n.estado,
          activo: !!n.activo,
          resaltar: (n.resaltar || []).slice(),
          fill: "#1e293b",
          stroke: estadosColor[n.estado] || "#64748b",
          lineWidth: n.activo ? 2.5 : 2,
        })
      );
      if (n.izq) {
        aristas.push({
          id: "merge-e:" + n.id + "-izq",
          capa: "merge",
          x1: cx,
          y1: cy + 18 * scale,
          x2: tx + n.izq._px * scale,
          y2: ty + n.izq._py * scale - 18 * scale,
          color: "#64748b",
          width: 2,
          escalera: true,
        });
      }
      if (n.der) {
        aristas.push({
          id: "merge-e:" + n.id + "-der",
          capa: "merge",
          x1: cx,
          y1: cy + 18 * scale,
          x2: tx + n.der._px * scale,
          y2: ty + n.der._py * scale - 18 * scale,
          color: "#64748b",
          width: 2,
          escalera: true,
        });
      }
    });
    return { nodos, aristas };
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

  function calcularLayout(paso, ui) {
    const w = logW || 900;
    const h = logH || ALTURA_LOGICA_DEF;
    const Z = zonas(w, h, { compactarArbol: paso && esPasoSoloReporte(paso) }, modoActual);
    const nodos = new Map();
    const aristas = [];
    const tam = ui.tamano || estadoInterno.tamano || 7;
    const m = modoActual;

    if (!paso || !paso.casilleros) {
      if (paso && paso.mergeArbol && Z.merge) {
        const M = layoutMerge(paso.mergeArbol, Z.merge);
        M.nodos.forEach((v, k) => nodos.set(k, v));
        aristas.push(...M.aristas);
      }
      if (paso && paso.listaIds && Z.lista) {
        const ord =
          paso.reporteOrdenado === true ||
          (paso.titulo &&
            /fusión terminada|lista ordenada|generarReporteOrdenado|tras merge/i.test(
              (paso.titulo || "") + (paso.decision || "")
            ));
        const st = canvasEl ? porCanvas.get(canvasEl) : null;
        const scroll = sincronizarListaScroll(st, paso.listaIds, Z);
        const L = layoutLista(paso.listaIds, paso.resaltar, Z.lista, ord, scroll);
        L.nodos.forEach((v, k) => nodos.set(k, v));
        aristas.push(...L.aristas);
      }
      return { nodos, aristas, opArbol: {} };
    }

    const BS = global.BancoSerial;
    const cas = BS.deserializarCasilleros(paso.casilleros);
    const balde = paso.balde ?? paso.hashIdx ?? estadoInterno.balde ?? 0;
    const hashIdx = paso.hashIdx ?? balde;

    if (Z.hash && m === "completo") {
      layoutHash(cas, hashIdx >= 0 ? hashIdx : -1, Z.hash).forEach((v, k) => nodos.set(k, v));
    }

    const op = {
      resaltar: paso.resaltar,
      cursor: paso.cursor,
      pivot: paso.pivot,
      puntero: paso.puntero,
      punteroPadre: paso.punteroPadre,
      punteroLabel: paso.punteroLabel,
      punteroDir: paso.punteroDir,
      punteroEsNulo: paso.punteroEsNulo,
      busqueda: paso.busqueda,
      rolAbuelo: paso.rolAbuelo,
      rolPadre: paso.rolPadre,
      rolTio: paso.rolTio,
      rolHermano: paso.rolHermano,
    };

    if (Z.arbol && necesitaArbol(paso) && cas[balde] !== undefined) {
      const A = layoutArbol(cas[balde], Z.arbol, op);
      A.nodos.forEach((v, k) => nodos.set(k, v));
      aristas.push(...A.aristas);
    } else if (Z.arbol && m === "arbol" && cas[balde] !== undefined) {
      const A = layoutArbol(cas[balde], Z.arbol, op);
      A.nodos.forEach((v, k) => nodos.set(k, v));
      aristas.push(...A.aristas);
    }

    if (Z.merge && paso.mergeArbol) {
      const M = layoutMerge(paso.mergeArbol, Z.merge);
      M.nodos.forEach((v, k) => nodos.set(k, v));
      aristas.push(...M.aristas);
    }

    if (Z.lista && paso.listaIds && paso.listaIds.length) {
      const ord =
        paso.reporteOrdenado === true ||
        (paso.titulo &&
          /fusión terminada|lista ordenada|generarReporteOrdenado|tras merge/i.test(
            (paso.titulo || "") + (paso.decision || "")
          ));
      const st = canvasEl ? porCanvas.get(canvasEl) : null;
      const scroll = sincronizarListaScroll(st, paso.listaIds, Z);
      const L = layoutLista(paso.listaIds, paso.resaltar, Z.lista, ord, scroll);
      L.nodos.forEach((v, k) => nodos.set(k, v));
      aristas.push(...L.aristas);
    }

    return { nodos: nodos, aristas, opArbol: op, balde, tam };
  }

  function aplicarLayoutDirecto(targetNodos, targetAristas, stRef) {
    matarTimeline();
    escena.aristas = targetAristas;
    const idsActivos = new Set(targetNodos.keys());
    targetNodos.forEach((target, id) => {
      escena.nodos.set(id, crearNodoVisual(Object.assign({}, target, { alpha: 1 })));
    });
    escena.nodos.forEach((n, id) => {
      if (!idsActivos.has(id)) escena.nodos.delete(id);
    });
    const st = stRef || porCanvas.get(canvasEl);
    if (st) {
      syncEstado(st);
      renderUnCanvas(st);
    }
    return Promise.resolve();
  }

  function animarHaciaLayout(targetNodos, targetAristas, instant) {
    matarTimeline();
    if (instant) {
      return aplicarLayoutDirecto(targetNodos, targetAristas);
    }
    if (!gsapDisponible()) {
      escena.aristas = targetAristas;
      targetNodos.forEach((n, id) => {
        const prev = escena.nodos.get(id);
        escena.nodos.set(id, prev ? Object.assign(prev, n) : crearNodoVisual(n));
      });
      escena.nodos.forEach((n, id) => {
        if (!targetNodos.has(id)) escena.nodos.delete(id);
      });
      renderLoop();
      return Promise.resolve();
    }

    const dur = instant ? 0 : DUR;
    escena.aristas = targetAristas;

    return new Promise((resolve) => {
      timeline = global.gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          timeline = null;
          porCanvas.forEach((s) => {
            if (s.canvas === canvasEl) {
              s.timeline = null;
              syncEstado(s);
            }
          });
          resolve();
        },
      });
      porCanvas.forEach((s) => {
        if (s.canvas === canvasEl) s.timeline = timeline;
      });

      const idsActivos = new Set(targetNodos.keys());

      targetNodos.forEach((target, id) => {
        let n = escena.nodos.get(id);
        if (!n) {
          n = crearNodoVisual(
            Object.assign({}, target, {
              x: target.x,
              y: target.y,
              alpha: instant ? 1 : 0,
            })
          );
          escena.nodos.set(id, n);
          if (!instant) {
            timeline.fromTo(n, { alpha: 0 }, { alpha: 1, duration: dur * 0.85 }, 0);
          }
        }
        n.forma = target.forma;
        n.capa = target.capa;
        n.valores = target.valores;
        n.mergeEstado = target.mergeEstado;
        n.resaltar = target.resaltar;
        n.hashIdx = target.hashIdx;
        n.cuenta = target.cuenta;
        timeline.to(
          n,
          {
            x: target.x,
            y: target.y,
            alpha: 1,
            radius: target.radius,
            width: target.width,
            height: target.height,
            duration: dur,
          },
          0
        );
        n.fill = target.fill;
        n.stroke = target.stroke;
        n.lineWidth = target.lineWidth;
        n.label = target.label;
        n.sublabel = target.sublabel;
        n.resaltado = target.resaltado;
        n.esRojo = target.esRojo;
        n.puntero = target.puntero;
        n.pivot = target.pivot;
        n.clave = target.clave;
        n.activo = target.activo;
      });

      escena.nodos.forEach((n, id) => {
        if (!idsActivos.has(id)) {
          timeline.to(
            n,
            {
              alpha: 0,
              duration: instant ? 0 : DUR_SALIDA,
              onComplete: () => escena.nodos.delete(id),
            },
            0
          );
        }
      });

      if (dur === 0) timeline.progress(1);
      if (timeline.duration() === 0) timeline.progress(1);
    });
  }

  function dibujarTituloZona(z) {
    ctx.fillStyle = "#64748b";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(z.titulo, z.x, z.y - 18);
    ctx.strokeStyle = "rgba(51, 65, 85, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(z.x - 2, z.y - 2, z.w + 4, z.h + 4);
    if (z.vertical) {
      ctx.strokeStyle = "rgba(51, 65, 85, 0.25)";
      ctx.beginPath();
      ctx.moveTo(z.x + z.w + 6, z.y - 2);
      ctx.lineTo(z.x + z.w + 6, z.y + z.h + 2);
      ctx.stroke();
    }
  }

  function dibujarArista(a) {
    if (a.alpha != null && a.alpha < 0.04) return;
    ctx.save();
    ctx.strokeStyle = a.color || "#475569";
    ctx.lineWidth = a.width || 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = a.alpha != null ? a.alpha : 1;
    ctx.beginPath();
    if (a.escalera) {
      const yMed = (a.y1 + a.y2) / 2;
      ctx.moveTo(a.x1, a.y1);
      ctx.lineTo(a.x1, yMed);
      ctx.lineTo(a.x2, yMed);
      ctx.lineTo(a.x2, a.y2);
    } else {
      ctx.moveTo(a.x1, a.y1);
      ctx.lineTo(a.x2, a.y2);
    }
    ctx.stroke();
    if (a.flecha) {
      const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
      const sz = 7;
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.moveTo(a.x2, a.y2);
      ctx.lineTo(a.x2 - sz * Math.cos(ang - 0.4), a.y2 - sz * Math.sin(ang - 0.4));
      ctx.lineTo(a.x2 - sz * Math.cos(ang + 0.4), a.y2 - sz * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
      if (a.label) {
        ctx.font = "9px system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(a.label, (a.x1 + a.x2) / 2, a.y1 - 10);
      }
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function dibujarChipFlotante(x, y, texto, color) {
    const t = texto || "actual";
    ctx.save();
    ctx.font = "bold 11px system-ui, sans-serif";
    const tw = ctx.measureText(t).width + 14;
    const th = 20;
    const bx = x - tw / 2;
    const by = y - th / 2;
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(bx, by, tw, th, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t, bx + tw / 2, by + th / 2);
    ctx.restore();
  }

  function nodoArbolPorCuenta(cuenta) {
    if (cuenta == null) return null;
    return escena.nodos.get(idArbol(Number(cuenta))) || null;
  }

  function hijosVisuales(nodoPadre) {
    const r = nodoPadre.radius || NODE_R;
    const hijos = [];
    escena.aristas.forEach((a) => {
      if (a.capa !== "arbol") return;
      if (Math.hypot(a.x1 - nodoPadre.x, a.y1 - nodoPadre.y) > r + 10) return;
      escena.nodos.forEach((n) => {
        if (n.capa !== "arbol") return;
        if (Math.hypot(n.x - a.x2, n.y - a.y2) < 8 && !hijos.includes(n)) hijos.push(n);
      });
    });
    return hijos;
  }

  function dibujarAristaDestacada(desde, hacia, etiqueta, color) {
    if (!desde || !hacia) return;
    const mx = (desde.x + hacia.x) / 2;
    const my = (desde.y + hacia.y) / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(desde.x, desde.y);
    ctx.lineTo(hacia.x, hacia.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(etiqueta, mx, my - 10);
    ctx.restore();
  }

  function dibujarOverlaysArbol(op) {
    if (!op) return;
    const hayArbol = [...escena.nodos.values()].some((n) => n.capa === "arbol");
    if (!hayArbol) return;

    const puntero = op.puntero != null ? Number(op.puntero) : null;
    const punteroPadre = op.punteroPadre != null ? Number(op.punteroPadre) : null;
    const busqueda = op.busqueda != null ? Number(op.busqueda) : null;
    const etiqueta = op.punteroLabel || "actual";

    const nPadre = punteroPadre != null ? nodoArbolPorCuenta(punteroPadre) : null;
    if (nPadre) {
      const r = nPadre.radius || NODE_R;
      dibujarChipFlotante(nPadre.x, nPadre.y - r - 28, "padre", "#94a3b8");
    }

    const nActual = puntero != null ? nodoArbolPorCuenta(puntero) : null;
    if (nActual) {
      const r = nActual.radius || NODE_R;
      dibujarChipFlotante(nActual.x, nActual.y - r - 28, etiqueta, "#fbbf24");

      if (op.punteroDir) {
        const hijos = hijosVisuales(nActual).sort((a, b) => a.x - b.x);
        const esIzq = op.punteroDir === "izq" || op.punteroDir === "izquierdo";
        const hijo =
          hijos.length === 0
            ? null
            : hijos.length === 1
              ? hijos[0]
              : esIzq
                ? hijos[0]
                : hijos[hijos.length - 1];
        if (hijo) {
          const txt = esIzq ? "← izquierdo" : "derecho →";
          dibujarAristaDestacada(nActual, hijo, txt, "#34d399");
        }
      }
    } else if (op.punteroEsNulo) {
      let maxY = -Infinity;
      let anchorX = logW / 2;
      escena.nodos.forEach((n) => {
        if (n.capa !== "arbol") return;
        maxY = Math.max(maxY, n.y + (n.radius || NODE_R));
        anchorX = n.x;
      });
      if (isFinite(maxY)) {
        dibujarChipFlotante(anchorX, maxY + 28, `${etiqueta} → ∅`, "#fbbf24");
      }
    }

    if (busqueda != null && busqueda !== puntero) {
      const nClave = nodoArbolPorCuenta(busqueda);
      if (nClave) {
        const r = nClave.radius || NODE_R;
        dibujarChipFlotante(nClave.x + r + 36, nClave.y - 8, `clave: ${busqueda}`, "#22d3ee");
      }
    }

    const nPiv = op.pivot != null ? nodoArbolPorCuenta(op.pivot) : null;
    if (nPiv && nPiv.cuenta !== puntero) {
      const r = nPiv.radius || NODE_R;
      dibujarChipFlotante(nPiv.x - 44, nPiv.y - r - 28, "pivote", "#a78bfa");
    }

    const familias = [
      { cuenta: op.rolAbuelo, label: "A abuelo", color: "#94a3b8", ox: -48 },
      { cuenta: op.rolPadre, label: "P padre", color: "#94a3b8", ox: 48 },
      { cuenta: op.rolTio, label: "T tío", color: "#f472b6", ox: 0 },
      { cuenta: op.rolHermano, label: "H hermano", color: "#fb923c", ox: 56 },
    ];
    familias.forEach((f) => {
      if (f.cuenta == null || Number(f.cuenta) === puntero) return;
      const n = nodoArbolPorCuenta(f.cuenta);
      if (!n) return;
      const r = n.radius || NODE_R;
      dibujarChipFlotante(n.x + f.ox, n.y - r - 30, f.label, f.color);
    });
  }

  function dibujarOverlaysFamilia(roles) {
    if (!roles || !roles.length) return;
    roles.forEach((f) => {
      const n = nodoArbolPorCuenta(f.cuenta);
      if (!n) return;
      const r = n.radius || NODE_R;
      const ox = f.ox != null ? f.ox : 0;
      dibujarChipFlotante(n.x + ox, n.y - r - 28, f.label, f.color || "#94a3b8");
    });
  }

  function dibujarNodo(n) {
    if (!n || n.alpha < 0.04) return;
    ctx.save();
    ctx.globalAlpha = n.alpha;

    if (n.forma === "hash-celda") {
      const hw = n.width / 2;
      const hh = n.height / 2;
      const x0 = n.x - hw;
      const y0 = n.y - hh;
      roundRect(x0, y0, n.width, n.height, 10);
      ctx.fillStyle = n.fill;
      ctx.fill();
      if (n.resaltado) {
        ctx.shadowColor = "rgba(56, 189, 248, 0.45)";
        ctx.shadowBlur = 12;
      }
      ctx.strokeStyle = n.stroke;
      ctx.lineWidth = n.lineWidth;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const idxW = Math.min(44, n.width * 0.28);
      const textX = x0 + idxW + 10;
      const textW = n.width - idxW - 16;

      ctx.fillStyle = n.resaltado ? "rgba(56, 189, 248, 0.22)" : "rgba(30, 41, 59, 0.85)";
      roundRect(x0 + 6, y0 + 6, idxW, n.height - 12, 8);
      ctx.fill();

      ctx.fillStyle = n.resaltado ? "#7dd3fc" : "#64748b";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("índice", n.x - hw + idxW / 2 + 6, y0 + 10);

      ctx.fillStyle = n.resaltado ? "#e0f2fe" : "#cbd5e1";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x - hw + idxW / 2 + 6, n.y + 4);

      ctx.textAlign = "left";
      ctx.fillStyle = n.cnt ? "#e2e8f0" : "#64748b";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(n.sublabel, textX, y0 + 12, textW);

      if (n.hint) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px system-ui, sans-serif";
        const lineas = n.hint.length > 22 ? [n.hint.slice(0, 22) + "…"] : [n.hint];
        lineas.forEach((ln, i) => {
          ctx.fillText(ln, textX, y0 + 32 + i * 14, textW);
        });
      }

      if (n.cnt > 0) {
        const badge = String(n.cnt);
        const bw = 10 + badge.length * 7;
        const bx = x0 + n.width - bw - 8;
        const by = y0 + 8;
        roundRect(bx, by, bw, 20, 10);
        ctx.fillStyle = n.resaltado ? "#0ea5e9" : "#334155";
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(badge, bx + bw / 2, by + 10);
      }

      ctx.restore();
      return;
    }

    if (n.forma === "merge-box" && n.valores) {
      const vals = n.valores;
      const y = n.y;
      const x = n.x;
      const MV = global.BancoMergeViz;
      const spec = MV && MV.especCeldasMerge
        ? MV.especCeldasMerge(vals.length)
        : { pill: false, cw: 42, gap: 5 };
      if (spec.pill) {
        roundRect(x - n.width / 2, y - 18, n.width, n.height, 6);
        ctx.fillStyle = n.fill;
        ctx.fill();
        ctx.strokeStyle = n.stroke;
        ctx.lineWidth = n.lineWidth;
        ctx.stroke();
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(vals[0] + " … " + vals[vals.length - 1] + " (" + vals.length + ")", x, y);
        ctx.restore();
        return;
      }
      const cw = spec.cw || 42;
      const gap = spec.gap != null ? spec.gap : 5;
      const totalW = vals.length * cw + Math.max(0, vals.length - 1) * gap;
      const x0 = x - totalW / 2;
      if (n.activo) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
        roundRect(x0 - 6, y - 22, totalW + 12, n.height + 12, 8);
        ctx.fill();
      }
      vals.forEach((v, i) => {
        const res = n.resaltar && n.resaltar.includes(i);
        const left = x0 + i * (cw + gap);
        roundRect(left + 2, y - 16, cw - 4, 32, 4);
        ctx.fillStyle = res ? "#16a34a" : "#1e293b";
        ctx.fill();
        ctx.strokeStyle = res ? "#22c55e" : "#64748b";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(v), left + cw / 2, y);
      });
      ctx.restore();
      return;
    }

    if (n.forma === "rect") {
      roundRect(n.x - n.width / 2, n.y - n.height / 2, n.width, n.height, 6);
      ctx.fillStyle = n.fill;
      ctx.fill();
      ctx.strokeStyle = n.stroke;
      ctx.lineWidth = n.lineWidth;
      ctx.stroke();
      ctx.fillStyle = "#e2e8f0";
      const fs =
        n.capa === "lista" && n.width < 44 ? "bold 10px" : n.capa === "lista" && n.width < 52 ? "bold 11px" : "bold 13px";
      ctx.font = fs + " system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x, n.y);
      ctx.restore();
      return;
    }

    const r = n.radius || NODE_R;
    if (n.resaltado || n.puntero || n.pivot || n.clave) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = n.puntero
        ? "rgba(251, 191, 36, 0.35)"
        : n.pivot
          ? "rgba(129, 140, 248, 0.4)"
          : n.clave
            ? "rgba(6, 182, 212, 0.25)"
            : "rgba(56, 189, 248, 0.25)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = n.fill;
    ctx.fill();
    ctx.strokeStyle = n.stroke;
    ctx.lineWidth = n.lineWidth;
    ctx.stroke();
    if (n.puntero) {
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#fbbf24";
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n.label, n.x, n.y);
    ctx.restore();
  }

  function dibujarBarraListaScroll(st, zona) {
    if (!st || !zona || !st.listaMaxScroll || st.listaMaxScroll <= 0) return;
    const trackY = zona.y + zona.h - 7;
    const trackW = zona.w;
    const contentW = trackW + st.listaMaxScroll;
    const thumbW = Math.max(28, (trackW / contentW) * trackW);
    const thumbX =
      zona.x + (st.listaMaxScroll > 0 ? (st.listaScrollX / st.listaMaxScroll) * (trackW - thumbW) : 0);
    ctx.fillStyle = "rgba(51, 65, 85, 0.55)";
    ctx.fillRect(zona.x, trackY, trackW, 5);
    ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
    ctx.fillRect(thumbX, trackY, thumbW, 5);
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("desplaza ↔ en esta franja", zona.x + zona.w - 6, zona.y + 4);
  }

  function renderUnCanvas(st) {
    bindEstado(st);
    if (!ctx || !canvasEl) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const Z = zonas(
      logW,
      logH,
      {
        mini: st.diagramaMini,
        compactarArbol: pasoActual && esPasoSoloReporte(pasoActual),
      },
      modoActual
    );
    if (Z.hash) dibujarTituloZona(Z.hash);
    if (Z.arbol && Z.arbol.titulo) dibujarTituloZona(Z.arbol);
    if (Z.merge) dibujarTituloZona(Z.merge);
    if (Z.lista) dibujarTituloZona(Z.lista);

    const ordenCapa = { arbol: 0, merge: 1, lista: 2, hash: 3 };
    const aristasOrd = escena.aristas.slice().sort((a, b) => (ordenCapa[a.capa] || 0) - (ordenCapa[b.capa] || 0));
    const nodosOrd = [...escena.nodos.values()].sort(
      (a, b) => (ordenCapa[a.capa] || 0) - (ordenCapa[b.capa] || 0)
    );

    aristasOrd.filter((a) => a.capa !== "lista").forEach(dibujarArista);
    nodosOrd.filter((n) => n.capa !== "lista").forEach(dibujarNodo);

    if (Z.lista) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(Z.lista.x, Z.lista.y, Z.lista.w, Z.lista.h);
      ctx.clip();
      aristasOrd.filter((a) => a.capa === "lista").forEach(dibujarArista);
      nodosOrd.filter((n) => n.capa === "lista").forEach(dibujarNodo);
      ctx.restore();
      dibujarBarraListaScroll(st, Z.lista);
    }

    if (Z.arbol || modoActual === "arbol") {
      if (st.pasoActual && st.pasoActual.rolesFamilia && st.pasoActual.rolesFamilia.length) {
        dibujarOverlaysFamilia(st.pasoActual.rolesFamilia);
      }
      dibujarOverlaysArbol(opArbolActual);
    }

    if (!escena.nodos.size && !pasoActual && !st.morphActivo) {
      ctx.fillStyle = "#64748b";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const msg =
        modoActual === "arbol"
          ? "Animar inserción o carga un caso"
          : modoActual === "merge-lista" || modoActual === "merge"
            ? "Animar MergeSort o ver lista"
            : "Ejecuta una operación para ver la animación";
      ctx.fillText(msg, logW / 2, logH / 2);
    }
    syncEstado(st);
  }

  function renderLoop() {
    porCanvas.forEach((st) => {
      if (!st.canvas.isConnected) return;
      bindEstado(st);
      prepararCanvas();
      renderUnCanvas(st);
    });
  }

  function coordsAristaArbol(p, h, radio) {
    const r = radio || NODE_R_MINI;
    const dx = h.x - p.x;
    const dy = h.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: p.x + ux * r,
      y1: p.y + uy * r,
      x2: h.x - ux * r,
      y2: h.y - uy * r,
    };
  }

  function aristasDesdeRaiz(raiz, nodos, radio) {
    const aristas = [];
    function walk(n) {
      if (!n) return;
      const cuenta = n.getCuenta();
      const padre = nodos.get(idArbol(cuenta));
      if (!padre) return;
      if (n.izquierdo) {
        const hijo = nodos.get(idArbol(n.izquierdo.getCuenta()));
        if (hijo) {
          const c = coordsAristaArbol(padre, hijo, radio);
          aristas.push({
            id: "arbol-e:" + cuenta + "-" + n.izquierdo.getCuenta(),
            capa: "arbol",
            x1: c.x1,
            y1: c.y1,
            x2: c.x2,
            y2: c.y2,
            color: "#94a3b8",
            width: 2.5,
          });
        }
      }
      if (n.derecho) {
        const hijo = nodos.get(idArbol(n.derecho.getCuenta()));
        if (hijo) {
          const c = coordsAristaArbol(padre, hijo, radio);
          aristas.push({
            id: "arbol-e:" + cuenta + "-" + n.derecho.getCuenta(),
            capa: "arbol",
            x1: c.x1,
            y1: c.y1,
            x2: c.x2,
            y2: c.y2,
            color: "#94a3b8",
            width: 2.5,
          });
        }
      }
      walk(n.izquierdo);
      walk(n.derecho);
    }
    walk(raiz);
    return aristas;
  }

  function boundsDeNodosMap(nodos) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    nodos.forEach((n) => {
      const r = n.radius || NODE_R_MINI;
      minX = Math.min(minX, n.x - r);
      maxX = Math.max(maxX, n.x + r);
      minY = Math.min(minY, n.y - r);
      maxY = Math.max(maxY, n.y + r);
    });
    if (!isFinite(minX)) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    return { minX, maxX, minY, maxY };
  }

  function transformarAristas(aristas, scale, tx, ty) {
    return aristas.map((a) => ({
      ...a,
      x1: a.x1 * scale + tx,
      y1: a.y1 * scale + ty,
      x2: a.x2 * scale + tx,
      y2: a.y2 * scale + ty,
      width: a.width ? Math.max(1.5, a.width * scale) : a.width,
    }));
  }

  /** Escala el grafo para ocupar la zona (permite ampliar si el árbol es pequeño). */
  function encajarGrafoEnZona(nodos, aristas, zona, opts) {
    if (!nodos.size) return { nodos, aristas };
    const pad = (opts && opts.pad) != null ? opts.pad : 16;
    const maxScale = (opts && opts.maxScale) != null ? opts.maxScale : 6;
    const minScale = (opts && opts.minScale) != null ? opts.minScale : 0.2;
    const b = boundsDeNodosMap(nodos);
    const bw = Math.max(b.maxX - b.minX, 1);
    const bh = Math.max(b.maxY - b.minY, 1);
    const scale = Math.max(
      minScale,
      Math.min(maxScale, (zona.w - pad * 2) / bw, (zona.h - pad * 2) / bh)
    );
    const tx = zona.x + pad + (zona.w - pad * 2 - bw * scale) / 2 - b.minX * scale;
    const ty = zona.y + pad + (zona.h - pad * 2 - bh * scale) / 2 - b.minY * scale;

    const out = new Map();
    nodos.forEach((n, id) => {
      const r0 = n.radius || NODE_R_MINI;
      const r = Math.min(32, Math.max(16, r0 * scale));
      out.set(
        id,
        crearNodoVisual(
          Object.assign({}, n, {
            x: n.x * scale + tx,
            y: n.y * scale + ty,
            radius: r,
          })
        )
      );
    });
    return { nodos: out, aristas: transformarAristas(aristas, scale, tx, ty) };
  }

  function encajarDosDiagramas(LA, LD, zona, opts) {
    const bA = boundsDeNodosMap(LA.nodos);
    const bD = boundsDeNodosMap(LD.nodos);
    const b = {
      minX: Math.min(bA.minX, bD.minX),
      maxX: Math.max(bA.maxX, bD.maxX),
      minY: Math.min(bA.minY, bD.minY),
      maxY: Math.max(bA.maxY, bD.maxY),
    };
    const pad = (opts && opts.pad) != null ? opts.pad : 16;
    const maxScale = (opts && opts.maxScale) != null ? opts.maxScale : 6;
    const bw = Math.max(b.maxX - b.minX, 1);
    const bh = Math.max(b.maxY - b.minY, 1);
    const scale = Math.min(maxScale, (zona.w - pad * 2) / bw, (zona.h - pad * 2) / bh);
    const tx = zona.x + pad + (zona.w - pad * 2 - bw * scale) / 2 - b.minX * scale;
    const ty = zona.y + pad + (zona.h - pad * 2 - bh * scale) / 2 - b.minY * scale;

    const mapN = (nodos) => {
      const out = new Map();
      nodos.forEach((n, id) => {
        const r0 = n.radius || NODE_R_MINI;
        const r = Math.min(32, Math.max(16, r0 * scale));
        out.set(
          id,
          crearNodoVisual(
            Object.assign({}, n, {
              x: n.x * scale + tx,
              y: n.y * scale + ty,
              radius: r,
            })
          )
        );
      });
      return out;
    };
    return {
      nodosA: mapN(LA.nodos),
      nodosD: mapN(LD.nodos),
      aristasA: transformarAristas(LA.aristas, scale, tx, ty),
      aristasD: transformarAristas(LD.aristas, scale, tx, ty),
    };
  }

  function layoutDiagramaEnZona(raiz, zona, resaltarSet, radio) {
    const nodos = new Map();
    if (!raiz) return { nodos, aristas: [] };

    const layout = [];
    const M =
      zona.h < 260 ? { t: 14, b: 14, l: 18, r: 18 } : { t: 22, b: 20, l: 24, r: 24 };
    function medir(n, depth, xMin, xMax) {
      if (!n) return;
      const mid = (xMin + xMax) / 2;
      layout.push({ n, x: mid, y: depth });
      medir(n.izquierdo, depth + 1, xMin, mid);
      medir(n.derecho, depth + 1, mid, xMax);
    }
    medir(raiz, 0, 0, 1);
    const maxD = Math.max(...layout.map((l) => l.y), 0);
    const scaleY = maxD > 0 ? (zona.h - M.t - M.b) / maxD : 0;
    const r = radio || NODE_R_MINI;

    layout.forEach(({ n, x, y }) => {
      const cuenta = n.getCuenta();
      const px = zona.x + M.l + x * (zona.w - M.l - M.r);
      const py = zona.y + M.t + y * scaleY;
      nodos.set(
        idArbol(cuenta),
        crearNodoVisual({
          id: idArbol(cuenta),
          capa: "arbol",
          forma: "circulo",
          x: px,
          y: py,
          radius: r,
          label: String(cuenta),
          esRojo: n.esRojo,
          fill: n.esRojo ? "#7f1d1d" : "#1e293b",
          stroke: n.esRojo ? "#ef4444" : "#94a3b8",
          resaltado: resaltarSet && resaltarSet.has(cuenta),
        })
      );
    });

    const aristas = aristasDesdeRaiz(raiz, nodos, r);
    return { nodos, aristas };
  }

  function pintarDiagrama(canvas, idDiagrama, op) {
    const RA = global.RbtAprendizaje;
    if (!RA || !idDiagrama || !canvas) return Promise.resolve();
    const st = ensureEstado(
      canvas,
      Object.assign({ modo: "arbol", diagramaMini: true }, op || {})
    );
    st.diagramaMini = true;
    bindEstado(st);
    const spec = RA.DIAGRAMAS[idDiagrama];
    prepararCanvas();
    if (logW < 40) {
      prepararCanvas();
    }
    registrarTicker();
    if (!spec) {
      st.pasoActual = null;
      escena.nodos.clear();
      escena.aristas = [];
      renderUnCanvas(st);
      return Promise.resolve();
    }
    const raiz = RA.construirArbol(spec);
    const resaltar = (RA.RESALTAR && RA.RESALTAR[idDiagrama]) || [];
    const Z = zonas(logW, logH, { mini: true }, "arbol");
    const R = layoutDiagramaEnZona(raiz, Z.arbol, new Set(resaltar.map(Number)), NODE_R_MINI);
    const E = encajarGrafoEnZona(R.nodos, R.aristas, Z.arbol, { pad: 14, maxScale: 5 });
    const rolesFamilia =
      RA.ROLES_DIAGRAMA && RA.ROLES_DIAGRAMA[idDiagrama] ? RA.ROLES_DIAGRAMA[idDiagrama] : null;
    st.pasoActual = { tipo: "diagrama", idDiagrama, rolesFamilia };
    return aplicarLayoutDirecto(E.nodos, E.aristas, st);
  }

  function morphDiagrama(canvas, idAntes, idDespues, alTerminar) {
    const RA = global.RbtAprendizaje;
    if (!RA || !gsapDisponible()) {
      pintarDiagrama(canvas, idDespues);
      if (alTerminar) alTerminar();
      return Promise.resolve();
    }
    const st = ensureEstado(canvas, { modo: "arbol", diagramaMini: true });
    st.diagramaMini = true;
    bindEstado(st);
    st.morphActivo = true;
    matarTimeline(canvas);
    prepararCanvas();
    registrarTicker();

    const raizA = RA.construirArbol(RA.DIAGRAMAS[idAntes]);
    const raizD = RA.construirArbol(RA.DIAGRAMAS[idDespues]);
    const Z = zonas(logW, logH, { mini: true }, "arbol");
    const res = new Set(
      [...(RA.RESALTAR && RA.RESALTAR[idAntes] ? RA.RESALTAR[idAntes] : []), ...(RA.RESALTAR && RA.RESALTAR[idDespues] ? RA.RESALTAR[idDespues] : [])].map(
        Number
      )
    );
    const LA0 = layoutDiagramaEnZona(raizA, Z.arbol, res, NODE_R_MINI);
    const LD0 = layoutDiagramaEnZona(raizD, Z.arbol, res, NODE_R_MINI);
    const enc = encajarDosDiagramas(LA0, LD0, Z.arbol, { pad: 14, maxScale: 5 });
    const LA = { nodos: enc.nodosA, aristas: enc.aristasA };
    const LD = { nodos: enc.nodosD, aristas: enc.aristasD };

    const targetNodos = new Map();
    const cuentas = new Set();
    LA.nodos.forEach((_v, k) => cuentas.add(Number(String(k).replace("arbol:", ""))));
    LD.nodos.forEach((_v, k) => cuentas.add(Number(String(k).replace("arbol:", ""))));

    cuentas.forEach((cuenta) => {
      const id = idArbol(cuenta);
      const a = LA.nodos.get(id);
      const d = LD.nodos.get(id);
      const src = escena.nodos.get(id);
      targetNodos.set(
        id,
        crearNodoVisual(
          Object.assign({}, d || a, {
            x: (d || a).x,
            y: (d || a).y,
            alpha: 1,
            x0: src ? src.x : a ? a.x : d.x,
            y0: src ? src.y : a ? a.y : d.y,
          })
        )
      );
      const t = targetNodos.get(id);
      if (!d && a) t.alpha = 0;
      if (!a && d) t.alpha = src ? 1 : 0;
    });

    const aristasTarget = LD.aristas.length ? LD.aristas : LA.aristas;

    return new Promise((resolve) => {
      timeline = global.gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          timeline = null;
          st.morphActivo = false;
          const rolesFin =
            RA.ROLES_DIAGRAMA && RA.ROLES_DIAGRAMA[idDespues]
              ? RA.ROLES_DIAGRAMA[idDespues]
              : null;
          st.pasoActual = { tipo: "diagrama", idDiagrama: idDespues, rolesFamilia: rolesFin };
          syncEstado(st);
          if (alTerminar) alTerminar();
          resolve();
        },
      });

      escena.aristas = aristasTarget;
      const dur = DUR_MORPH_DIAG;

      targetNodos.forEach((target, id) => {
        let n = escena.nodos.get(id);
        const xFrom = n ? n.x : target.x0 != null ? target.x0 : target.x;
        const yFrom = n ? n.y : target.y0 != null ? target.y0 : target.y;
        if (!n) {
          n = crearNodoVisual(Object.assign({}, target, { x: xFrom, y: yFrom, alpha: 0 }));
          escena.nodos.set(id, n);
        }
        timeline.to(
          n,
          {
            x: target.x,
            y: target.y,
            alpha: target.alpha !== undefined ? target.alpha : 1,
            fill: target.fill,
            stroke: target.stroke,
            esRojo: target.esRojo,
            duration: dur,
          },
          0
        );
      });

      escena.nodos.forEach((n, id) => {
        if (!targetNodos.has(id)) {
          timeline.to(n, { alpha: 0, duration: dur * 0.5, onComplete: () => escena.nodos.delete(id) }, 0);
        }
      });

      syncEstado(st);
    });
  }

  function aplicarPaso(paso, ui, opts) {
    if (!ui || !ui.canvas) return Promise.resolve(null);
    const st = ensureEstado(ui.canvas, {
      tamano: ui.tamano,
      modo: ui.modo || modoActual,
      alturaLogica: parseInt(ui.canvas.dataset.alturaLogica, 10) || undefined,
    });
    bindEstado(st);
    st.morphActivo = false;
    pasoActual = paso;
    st.pasoActual = paso;
    const instant = !!(opts && opts.instantaneo);

    if (ui.tamano) estadoInterno.tamano = ui.tamano;

    const { nodos, aristas, opArbol } = calcularLayout(paso, ui || {});
    opArbolActual = opArbol || {};

    if (paso && paso.casilleros) {
      estadoInterno.hashKey = JSON.stringify(paso.casilleros);
      estadoInterno.balde = paso.balde ?? paso.hashIdx ?? estadoInterno.balde;
    }

    prepararCanvas();
    registrarTicker();

    return animarHaciaLayout(nodos, aristas, instant).then(() => {
      syncEstado(st);
      if (ui.formulaEl && paso) {
        const BD = global.BancoDoc;
        const clave = paso.cursor ?? paso.busqueda;
        if (clave != null && BD && ui.tamano) {
          const idx = BD.calcularIndice(clave, ui.tamano);
          if (paso.tipo === "hash") {
            ui.formulaEl.textContent = `${clave} % ${ui.tamano} = ${idx}  →  casilleros[${idx}]`;
          }
        }
      }
      return paso && paso.casilleros && global.BancoSerial
        ? global.BancoSerial.deserializarCasilleros(paso.casilleros)
        : null;
    });
  }

  function reiniciar(ui) {
    if (!ui || !ui.canvas) return;
    const st = ensureEstado(ui.canvas, { modo: ui.modo });
    bindEstado(st);
    matarTimeline();
    pasoActual = null;
    st.pasoActual = null;
    st.morphActivo = false;
    st.listaScrollX = 0;
    st.listaMaxScroll = 0;
    st.listaIdsKey = "";
    opArbolActual = {};
    estadoInterno.hashKey = "";
    escena.nodos.clear();
    escena.aristas = [];
    syncEstado(st);
    prepararCanvas();
    renderUnCanvas(st);
  }

  function pintarVacio(ui) {
    reiniciar(ui);
  }

  function enlazarCanvas(canvas, st) {
    if (st.resizeObs) st.resizeObs.disconnect();
    if (global.ResizeObserver && canvas.parentElement) {
      st.resizeObs = new ResizeObserver(() => {
        bindEstado(st);
        prepararCanvas();
        if (st.pasoActual && !st.morphActivo) {
          if (st.pasoActual.tipo === "diagrama" && st.pasoActual.idDiagrama) {
            pintarDiagrama(st.canvas, st.pasoActual.idDiagrama);
            return;
          }
          const { nodos, aristas } = calcularLayout(st.pasoActual, { tamano: st.tamano, modo: st.modo });
          escena.aristas = aristas;
          nodos.forEach((target, id) => {
            const n = escena.nodos.get(id);
            if (n) {
              n.x = target.x;
              n.y = target.y;
              n.width = target.width;
              n.height = target.height;
            }
          });
          syncEstado(st);
        }
        renderUnCanvas(st);
      });
      st.resizeObs.observe(canvas.parentElement);
    }

    if (!st.wheelBound) {
      st.wheelBound = true;
      canvas.addEventListener(
        "wheel",
        (ev) => {
          bindEstado(st);
          prepararCanvas();
          const Z = zonas(
            logW,
            logH,
            { compactarArbol: pasoActual && esPasoSoloReporte(pasoActual) },
            modoActual
          );
          if (!Z.lista || !st.listaMaxScroll) return;
          const rect = canvas.getBoundingClientRect();
          const x = ev.clientX - rect.left;
          const y = ev.clientY - rect.top;
          if (
            x < Z.lista.x ||
            x > Z.lista.x + Z.lista.w ||
            y < Z.lista.y ||
            y > Z.lista.y + Z.lista.h
          ) {
            return;
          }
          ev.preventDefault();
          const delta = ev.deltaX !== 0 ? ev.deltaX : ev.deltaY;
          st.listaScrollX = Math.max(0, Math.min(st.listaMaxScroll, st.listaScrollX + delta));
          if (st.pasoActual && !st.morphActivo) {
            const { nodos, aristas } = calcularLayout(st.pasoActual, {
              tamano: st.tamano,
              modo: st.modo,
            });
            escena.aristas = aristas;
            const ids = new Set(nodos.keys());
            nodos.forEach((target, id) => {
              escena.nodos.set(id, crearNodoVisual(Object.assign({}, target, { alpha: 1 })));
            });
            escena.nodos.forEach((_n, id) => {
              if (!ids.has(id)) escena.nodos.delete(id);
            });
          }
          renderUnCanvas(st);
        },
        { passive: false }
      );
    }

    if (!st.clickBound) {
      st.clickBound = true;
      canvas.addEventListener("click", (ev) => {
        bindEstado(st);
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        for (const n of escena.nodos.values()) {
          if (n.capa !== "hash" || n.forma !== "hash-celda") continue;
          const hw = n.width / 2;
          const hh = n.height / 2;
          if (x >= n.x - hw && x <= n.x + hw && y >= n.y - hh && y <= n.y + hh) {
            if (n.hashIdx != null && st.onBaldeClick) st.onBaldeClick(n.hashIdx);
            break;
          }
        }
      });
    }
  }

  function init(canvas, opciones) {
    const st = ensureEstado(canvas, opciones);
    bindEstado(st);
    prepararCanvas();
    registrarTicker();
    renderUnCanvas(st);
    return st;
  }

  function modoDesdeUi(ui) {
    if (ui.modo) return ui.modo;
    if (ui.canvas && !ui.hashEl && !ui.canvasMerge) return "arbol";
    if (ui.canvasMerge && !ui.canvas) return "merge-lista";
    if (ui.canvas && ui.canvasMerge) return "completo";
    return "completo";
  }

  global.BancoVisualUnificado = {
    porCanvas,
    init,
    obtener,
    aplicarPaso,
    reiniciar,
    pintarVacio,
    pintarDiagrama,
    morphDiagrama,
    aplicarLayoutDirecto,
    renderLoop,
    calcularLayout,
    matarTimeline,
    modoDesdeUi,
    get escena() {
      return escena;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
