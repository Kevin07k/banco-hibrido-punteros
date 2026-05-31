/**
 * Réplica educativa en JS de la capa datos (hash + RBT + reporte).
 * Alineada con TablaHash, ArbolRojoNegro y ReporteLista del proyecto Java.
 */
(function (global) {
  "use strict";

  class Cliente {
  constructor(cuenta, nombre, tipo, saldo) {
    this.cuenta = cuenta;
    this.nombre = nombre;
    this.tipo = tipo;
    this.saldo = saldo;
  }
}

  class NodoHibrido {
  constructor(cliente) {
    this.datos = cliente;
    this.izquierdo = null;
    this.derecho = null;
    this.padre = null;
    this.siguiente = null;
    this.esRojo = true;
  }

  getCuenta() {
    return this.datos.cuenta;
  }
}

  function calcularIndice(cuenta, tamano) {
  return ((cuenta % tamano) + tamano) % tamano;
}

// --- Árbol rojo-negro (misma lógica que ArbolRojoNegro.java) ---

  function buscar(raiz, cuenta) {
  let actual = raiz;
  while (actual) {
    if (cuenta === actual.getCuenta()) return actual;
    actual = cuenta < actual.getCuenta() ? actual.izquierdo : actual.derecho;
  }
  return null;
}

  function insertar(raiz, nuevo, onPaso) {
  nuevo.siguiente = null;
  const log = (msg, tipo = "") => onPaso?.(msg, tipo);

  if (!raiz) {
    nuevo.esRojo = false;
    log("Árbol vacío: el nodo se convierte en raíz NEGRA.", "ok");
    return nuevo;
  }

  log(`BST: buscando posición para cuenta ${nuevo.getCuenta()}…`);
  insertarEnArbol(raiz, nuevo, log);
  log("RBT: ejecutando corregirInsercion() (recoloreo / rotaciones).", "activo");
  corregirInsercion(nuevo, log);
  const nuevaRaiz = obtenerRaiz(nuevo);
  if (nuevaRaiz) nuevaRaiz.esRojo = false;
  log("Raíz forzada a NEGRO. Inserción completa.", "ok");
  return nuevaRaiz;
}

function insertarEnArbol(raiz, nuevo, log) {
  let actual = raiz;
  let padre = null;
  while (actual) {
    padre = actual;
    if (nuevo.getCuenta() < actual.getCuenta()) {
      log(`  ${nuevo.getCuenta()} < ${actual.getCuenta()} → izquierda`);
      actual = actual.izquierdo;
    } else {
      log(`  ${nuevo.getCuenta()} ≥ ${actual.getCuenta()} → derecha`);
      actual = actual.derecho;
    }
  }
  nuevo.padre = padre;
  if (nuevo.getCuenta() < padre.getCuenta()) {
    padre.izquierdo = nuevo;
    log(`Enlazado como hijo IZQUIERDO de ${padre.getCuenta()} (ROJO).`, "ok");
  } else {
    padre.derecho = nuevo;
    log(`Enlazado como hijo DERECHO de ${padre.getCuenta()} (ROJO).`, "ok");
  }
}

function corregirInsercion(nodo, log) {
  let actual = nodo;
  while (actual.padre && actual.padre.esRojo) {
    let padre = actual.padre;
    let abuelo = padre.padre;
    if (!abuelo) break;

    if (padre === abuelo.izquierdo) {
      const tio = abuelo.derecho;
      if (tio && tio.esRojo) {
        log("Inserción — Caso 3: tío rojo → recolorear padre, tío y abuelo.", "activo");
        padre.esRojo = false;
        tio.esRojo = false;
        abuelo.esRojo = true;
        actual = abuelo;
      } else {
        if (actual === padre.derecho) {
          log("Inserción — Caso 4: triángulo (Zig-Zag) → rotación en el padre.", "activo");
          actual = padre;
          rotarIzquierda(actual, log);
          padre = actual.padre;
          abuelo = padre ? padre.padre : null;
        }
        if (padre && abuelo) {
          log("Inserción — Caso 5: línea (Zig-Zig) → rotación en el abuelo + recolorar.", "activo");
          padre.esRojo = false;
          abuelo.esRojo = true;
          rotarDerecha(abuelo, log);
        }
      }
    } else {
      const tio = abuelo.izquierdo;
      if (tio && tio.esRojo) {
        log("Inserción — Caso 3 (espejo): tío rojo → recolorear.", "activo");
        padre.esRojo = false;
        tio.esRojo = false;
        abuelo.esRojo = true;
        actual = abuelo;
      } else {
        if (actual === padre.izquierdo) {
          log("Inserción — Caso 4 (espejo): triángulo → rotación en el padre.", "activo");
          actual = padre;
          rotarDerecha(actual, log);
          padre = actual.padre;
          abuelo = padre ? padre.padre : null;
        }
        if (padre && abuelo) {
          log("Inserción — Caso 5 (espejo): línea → rotación en el abuelo + recolorar.", "activo");
          padre.esRojo = false;
          abuelo.esRojo = true;
          rotarIzquierda(abuelo, log);
        }
      }
    }
  }
}

function rotarIzquierda(nodo, log) {
  log(`rotarIzquierda(${nodo.getCuenta()})`, "activo");
  const pivot = nodo.derecho;
  nodo.derecho = pivot.izquierdo;
  if (pivot.izquierdo) pivot.izquierdo.padre = nodo;
  pivot.padre = nodo.padre;
  if (nodo.padre) {
    if (nodo === nodo.padre.izquierdo) nodo.padre.izquierdo = pivot;
    else nodo.padre.derecho = pivot;
  }
  pivot.izquierdo = nodo;
  nodo.padre = pivot;
}

function rotarDerecha(nodo, log) {
  log(`rotarDerecha(${nodo.getCuenta()})`, "activo");
  const pivot = nodo.izquierdo;
  nodo.izquierdo = pivot.derecho;
  if (pivot.derecho) pivot.derecho.padre = nodo;
  pivot.padre = nodo.padre;
  if (nodo.padre) {
    if (nodo === nodo.padre.izquierdo) nodo.padre.izquierdo = pivot;
    else nodo.padre.derecho = pivot;
  }
  pivot.derecho = nodo;
  nodo.padre = pivot;
}

function obtenerRaiz(nodo) {
  let actual = nodo;
  while (actual.padre) actual = actual.padre;
  return actual;
}

  function contar(nodo) {
  if (!nodo) return 0;
  return 1 + contar(nodo.izquierdo) + contar(nodo.derecho);
}

// --- Reporte (ReporteLista.java) ---

  function limpiarSiguiente(nodo) {
  if (!nodo) return;
  limpiarSiguiente(nodo.izquierdo);
  nodo.siguiente = null;
  limpiarSiguiente(nodo.derecho);
}

  function encadenarInorden(raiz, encadenador) {
  if (!raiz) return;
  encadenarInorden(raiz.izquierdo, encadenador);
  encadenador.agregar(raiz);
  encadenarInorden(raiz.derecho, encadenador);
}

  class Encadenador {
  constructor(cabeza = null, cola = null) {
    this.cabeza = cabeza;
    this.cola = cola;
  }

  agregar(nodo) {
    nodo.siguiente = null;
    if (!this.cabeza) {
      this.cabeza = nodo;
      this.cola = nodo;
      return;
    }
    this.cola.siguiente = nodo;
    this.cola = nodo;
  }
}

  function mergeSortLista(cabeza, onPaso) {
  const log = (m, t = "") => onPaso?.(m, t);
  if (!cabeza || !cabeza.siguiente) {
    log(cabeza ? `Lista de 1 nodo [${cabeza.getCuenta()}] — base.` : "Lista vacía.", "ok");
    return cabeza;
  }
  const segunda = dividirLista(cabeza, log);
  log("Divide: mergeSort recursivo en ambas mitades.", "activo");
  const izq = mergeSortLista(cabeza, onPaso);
  const der = mergeSortLista(segunda, onPaso);
  return fusionarListas(izq, der, log);
}

function dividirLista(cabeza, log) {
  let lento = cabeza;
  let rapido = cabeza.siguiente;
  while (rapido && rapido.siguiente) {
    lento = lento.siguiente;
    rapido = rapido.siguiente.siguiente;
  }
  const segunda = lento.siguiente;
  lento.siguiente = null;
  const ids = (n) => {
    const a = [];
    let x = n;
    while (x) {
      a.push(x.getCuenta());
      x = x.siguiente;
    }
    return a.join(" → ");
  };
  log(`dividirLista: [${ids(cabeza)}] | [${ids(segunda)}]`);
  return segunda;
}

function fusionarListas(a, b, log) {
  const dummy = new NodoHibrido(new Cliente(0, "", "", 0));
  let actual = dummy;
  const partes = [];
  while (a && b) {
    if (a.getCuenta() <= b.getCuenta()) {
      partes.push(a.getCuenta());
      actual.siguiente = a;
      a = a.siguiente;
    } else {
      partes.push(b.getCuenta());
      actual.siguiente = b;
      b = b.siguiente;
    }
    actual = actual.siguiente;
  }
  actual.siguiente = a || b;
  log(`fusionarListas: tomó ${partes.join(", ")}…`, "ok");
  return dummy.siguiente;
}

  function nodoEnLayout(layout, cuenta) {
    if (cuenta == null) return null;
    const c = Number(cuenta);
    for (let i = 0; i < layout.length; i++) {
      if (layout[i].n.getCuenta() === c) return layout[i].n;
    }
    return null;
  }

  /** Flecha de variable (actual, padre, …) hacia el nodo referenciado */
  function dibujarCajaPuntero(ctx, bx, by, nx, ny, label, color) {
    const texto = label || "actual";
    ctx.font = "bold 11px system-ui, sans-serif";
    const tw = ctx.measureText(texto).width + 14;
    const th = 20;
    const x = bx;
    const y = by;

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, tw, th, 4);
    else ctx.rect(x, y, tw, th);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, x + tw / 2, y + th / 2);

    const ox = x + tw / 2;
    const oy = y + th;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    const ang = Math.atan2(ny - oy, nx - ox);
    const len = Math.hypot(nx - ox, ny - oy) - 28;
    const ex = ox + Math.cos(ang) * Math.max(len, 8);
    const ey = oy + Math.sin(ang) * Math.max(len, 8);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 7 * Math.cos(ang - 0.45), ey - 7 * Math.sin(ang - 0.45));
    ctx.lineTo(ex - 7 * Math.cos(ang + 0.45), ey - 7 * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /** Calcula caja que incluye nodos, etiquetas de puntero y chips. */
  function calcularBoundsArbol(layout, op) {
    const R = 40;
    const PW = 92;
    const PH = 72;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const grow = (x0, y0, x1, y1) => {
      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      maxX = Math.max(maxX, x1);
      maxY = Math.max(maxY, y1);
    };

    layout.forEach(({ n }) => {
      grow(n._px - R, n._py - R, n._px + R, n._py + R);
    });

    const puntero = op.puntero != null ? Number(op.puntero) : null;
    const punteroPadre = op.punteroPadre != null ? Number(op.punteroPadre) : null;
    const busqueda = op.busqueda != null ? Number(op.busqueda) : null;
    const punteroDir = op.punteroDir || null;

    const nActual = nodoEnLayout(layout, puntero);
    const nPadre = nodoEnLayout(layout, punteroPadre);
    const nBusq = busqueda != null ? nodoEnLayout(layout, busqueda) : null;

    if (nActual) grow(nActual._px - PW, nActual._py - PH, nActual._px + R, nActual._py + R);
    if (nPadre) grow(nPadre._px - PW, nPadre._py - PH, nPadre._px + R, nPadre._py + R);

    if (punteroDir && nActual) {
      const hijo =
        punteroDir === "izq" || punteroDir === "izquierdo" ? nActual.izquierdo : nActual.derecho;
      if (hijo) grow(hijo._px - R, hijo._py - R, hijo._px + R, hijo._py + R);
    }

    if (op.punteroEsNulo && layout.length) {
      grow(8, maxY + 6, 112, maxY + 36);
    }

    if (busqueda != null) {
      grow(maxX + 6, 6, maxX + 96, 30);
      if (nBusq) grow(nBusq._px - 32, nBusq._py - 32, nBusq._px + 32, nBusq._py + 32);
    }

    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 100;
      maxY = 100;
    }
    return { minX, minY, maxX, maxY };
  }

  function vistaEncajarArbol(w, h, bounds, margen) {
    const pad = margen == null ? 32 : margen;
    const bw = Math.max(bounds.maxX - bounds.minX, 1);
    const bh = Math.max(bounds.maxY - bounds.minY, 1);
    const scale = Math.min(1, (w - pad * 2) / bw, (h - pad * 2) / bh);
    const tx = pad + (w - pad * 2 - bw * scale) / 2 - bounds.minX * scale;
    const ty = pad + (h - pad * 2 - bh * scale) / 2 - bounds.minY * scale;
    return { scale, tx, ty };
  }

  function dibujarAristaActiva(ctx, n, hijo, etiqueta, color) {
    if (!n || !hijo) return;
    const mx = (n._px + hijo._px) / 2;
    const my = (n._py + hijo._py) / 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(n._px, n._py);
    ctx.lineTo(hijo._px, hijo._py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(etiqueta, mx, my - 8);
  }

  /** Dibuja árbol; opciones: resaltar[], cursor, pivot, puntero, punteroLabel, punteroDir, busqueda, punteroPadre */
  function dibujarArbolDirecto(canvas, raiz, opciones) {
  const op = opciones || {};
  const resaltar = new Set((op.resaltar || []).map(Number));
  const cursor = op.cursor != null ? Number(op.cursor) : null;
  const pivot = op.pivot != null ? Number(op.pivot) : null;
  const puntero = op.puntero != null ? Number(op.puntero) : null;
  const punteroPadre = op.punteroPadre != null ? Number(op.punteroPadre) : null;
  const punteroLabel = op.punteroLabel || "actual";
  const punteroDir = op.punteroDir || null;
  const busqueda = op.busqueda != null ? Number(op.busqueda) : cursor;

  const BT0 = global.BancoTransicion;
  const alturaLogica = raiz && BT0 ? BT0.alturaLogicaArbol(raiz) : parseInt(canvas.dataset.alturaLogica, 10) || 360;
  canvas.dataset.alturaLogica = String(alturaLogica);

  const prep = global.BancoCanvas
    ? global.BancoCanvas.preparar(canvas, alturaLogica)
    : null;
  const ctx = canvas.getContext("2d");
  const w = prep ? prep.w : canvas.width;
  const h = prep ? prep.h : canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!raiz) {
    ctx.fillStyle = "#64748b";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("(árbol vacío)", w / 2, h / 2);
    return;
  }
  let layout;
  const BT = global.BancoTransicion;
  if (BT) {
    const { pos } = BT.layoutPosiciones(raiz, w, h);
    layout = BT.asignarLayoutANodos(raiz, pos);
    if (!op._internoMorph || op.instantaneo) {
      BT.guardarPosicionesCanvas(canvas, pos);
    }
  } else {
    layout = [];
    function medir(n, depth, xMin, xMax) {
      if (!n) return;
      const mid = (xMin + xMax) / 2;
      layout.push({ n, x: mid, y: depth });
      medir(n.izquierdo, depth + 1, xMin, mid);
      medir(n.derecho, depth + 1, mid, xMax);
    }
    medir(raiz, 0, 0, 1);
    const maxD = Math.max(...layout.map((l) => l.y), 0);
    const M = { t: 58, b: 52, l: 68, r: 68 };
    const scaleY = maxD > 0 ? (h - M.t - M.b) / maxD : 0;
    layout.forEach(({ n, x, y }) => {
      n._px = M.l + x * (w - M.l - M.r);
      n._py = M.t + y * scaleY;
    });
  }

  const bounds = calcularBoundsArbol(layout, op);
  const vista = BT ? BT.vistaEncajar(w, h, bounds, 28) : vistaEncajarArbol(w, h, bounds, 28);
  ctx.save();
  ctx.translate(vista.tx, vista.ty);
  ctx.scale(vista.scale, vista.scale);

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.5;
  layout.forEach(({ n }) => {
    if (n.izquierdo) {
      ctx.beginPath();
      ctx.moveTo(n._px, n._py);
      ctx.lineTo(n.izquierdo._px, n.izquierdo._py);
      ctx.stroke();
    }
    if (n.derecho) {
      ctx.beginPath();
      ctx.moveTo(n._px, n._py);
      ctx.lineTo(n.derecho._px, n.derecho._py);
      ctx.stroke();
    }
  });

  layout.forEach(({ n }) => {
    const px = n._px;
    const py = n._py;
    const c = n.getCuenta();
    const r = 26;
    const esRes = resaltar.has(c);
    const esCur = puntero === c;
    const esPiv = pivot === c;
    const esClave = busqueda === c && !esCur;
    const alphaRes =
      op.resaltarAlpha && op.resaltarAlpha[c] != null ? op.resaltarAlpha[c] : esRes ? 1 : 0;

    if (alphaRes > 0.04 || esCur || esPiv || esClave) {
      ctx.save();
      if (alphaRes > 0.04) ctx.globalAlpha = alphaRes;
      ctx.beginPath();
      ctx.arc(px, py, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = esCur
        ? "rgba(251, 191, 36, 0.35)"
        : esPiv
          ? "rgba(129, 140, 248, 0.4)"
          : esClave
            ? "rgba(6, 182, 212, 0.25)"
            : "rgba(56, 189, 248, 0.25)";
      ctx.fill();
      if (alphaRes > 0.04) ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = n.esRojo ? "#7f1d1d" : "#1e293b";
    ctx.fill();
    ctx.strokeStyle = esCur ? "#fbbf24" : n.esRojo ? "#ef4444" : "#94a3b8";
    ctx.lineWidth = esCur ? 3 : 2;
    ctx.stroke();

    if (esCur) {
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(px, py, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#fbbf24";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(c), px, py);
  });

  const nActual = nodoEnLayout(layout, puntero);
  const nPadre = nodoEnLayout(layout, punteroPadre);
  const nBusq = busqueda != null ? nodoEnLayout(layout, busqueda) : null;
  const io = op.intensidadOverlays != null ? Math.max(0, Math.min(1, op.intensidadOverlays)) : 1;

  ctx.save();
  ctx.globalAlpha = io;

  if (punteroDir && nActual) {
    const hijo = punteroDir === "izq" || punteroDir === "izquierdo" ? nActual.izquierdo : nActual.derecho;
    const etiqueta = punteroDir === "izq" || punteroDir === "izquierdo" ? "← izquierdo" : "derecho →";
    dibujarAristaActiva(ctx, nActual, hijo, etiqueta, "#34d399");
  }

  if (nPadre) {
    dibujarCajaPuntero(ctx, nPadre._px - 78, nPadre._py - 58, nPadre._px, nPadre._py, "padre", "#94a3b8");
  }

  if (nActual) {
    dibujarCajaPuntero(ctx, nActual._px - 78, nActual._py - 58, nActual._px, nActual._py, punteroLabel, "#fbbf24");
  } else if (op.punteroEsNulo) {
    ctx.fillStyle = "rgba(251, 191, 36, 0.15)";
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    const tx = bounds.minX + 8;
    const ty = bounds.maxY + 10;
    const tw = 88;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 22, 4);
    else ctx.rect(tx, ty, tw, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${punteroLabel} → ∅`, tx + tw / 2, ty + 11);
  }

  if (busqueda != null) {
    const chip = `clave: ${busqueda}`;
    ctx.font = "bold 11px system-ui, sans-serif";
    const cw = ctx.measureText(chip).width + 16;
    const cx = bounds.maxX + 10;
    const cy = bounds.minY + 6;
    ctx.fillStyle = "rgba(6, 182, 212, 0.2)";
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx, cy, cw, 22, 4);
    else ctx.rect(cx, cy, cw, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#67e8f9";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(chip, cx + cw / 2, cy + 11);
    if (nBusq) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(nBusq._px - 30, nBusq._py - 30, 60, 60);
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
  ctx.restore();
}

  function dibujarArbol(canvas, raiz, opciones) {
    const op = opciones || {};
    const done = op.alTerminar;
    if (op._internoMorph) {
      dibujarArbolDirecto(canvas, raiz, op);
      return;
    }
    if (global.BancoTransicion && canvas) {
      global.BancoTransicion.pintarArbol(canvas, raiz, op);
      return;
    }
    dibujarArbolDirecto(canvas, raiz, op);
    if (done) done();
  }

  function renderListaEnlazada(contenedor, cabeza, resaltar = null) {
  contenedor.innerHTML = "";
  if (!cabeza) {
    contenedor.innerHTML = '<span class="nota">Lista vacía</span>';
    return;
  }
  let actual = cabeza;
  while (actual) {
    const wrap = document.createElement("div");
    wrap.className = "nodo-lista";
    const caja = document.createElement("div");
    caja.className = "caja-nodo" + (actual === resaltar ? " resaltado" : "");
    caja.innerHTML = `<strong>${actual.getCuenta()}</strong><br><small>${actual.datos.nombre || ""}</small>`;
    wrap.appendChild(caja);
    actual = actual.siguiente;
    if (actual) {
      const flecha = document.createElement("span");
      flecha.className = "flecha";
      flecha.textContent = "→ siguiente";
      wrap.appendChild(flecha);
    }
    contenedor.appendChild(wrap);
  }
}

  function renderHash(casilleros, indiceResaltado = -1) {
  return casilleros
    .map((raiz, i) => {
      const n = contar(raiz);
      const cls = ["casillero", i === indiceResaltado ? "resaltado" : "", n ? "" : "vacio"].filter(Boolean).join(" ");
      const label = n ? `${n} nodo(s)` : "vacío";
      const mini = raiz ? `raíz ${raiz.getCuenta()}` : "—";
      return `<div class="${cls}" data-idx="${i}">
        <div class="idx">[${i}]</div>
        <div class="cuenta-mini">${label}</div>
        <div style="font-size:0.7rem;color:#94a3b8">${mini}</div>
      </div>`;
    })
    .join("");
  }

  global.BancoDoc = {
    Cliente,
    NodoHibrido,
    calcularIndice,
    buscar,
    insertar,
    obtenerRaiz,
    contar,
    limpiarSiguiente,
    encadenarInorden,
    Encadenador,
    mergeSortLista,
    dibujarArbol,
    renderListaEnlazada,
    renderHash,
  };
})(typeof window !== "undefined" ? window : globalThis);
