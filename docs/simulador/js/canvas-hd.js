/**
 * Canvas nítido en pantallas HiDPI (devicePixelRatio).
 */
(function (global) {
  "use strict";

  function obtenerDpr() {
    const raw = global.devicePixelRatio || 1;
    return Math.min(Math.max(raw, 1), 3);
  }

  function prepararCanvasHD(canvas, alturaLogica, opts) {
    const op = opts || {};
    const padre = canvas.parentElement;
    const rect = canvas.getBoundingClientRect();
    const anchoPadre = padre ? padre.clientWidth : 0;
    const ancho =
      rect.width > 0
        ? rect.width
        : anchoPadre > 0
          ? Math.max(320, anchoPadre - 4)
          : Math.max(320, canvas.clientWidth || 700);

    const alto = Number(alturaLogica) || Number(canvas.dataset.alturaLogica) || 360;
    const dpr = obtenerDpr();

    canvas._logW = ancho;
    canvas._logH = alto;
    canvas._dpr = dpr;
    canvas.style.width = ancho + "px";
    canvas.style.height = alto + "px";
    canvas.style.maxWidth = "100%";

    const pxW = Math.round(ancho * dpr);
    const pxH = Math.round(alto * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const mismoBuffer = canvas.width === pxW && canvas.height === pxH;
    if (!op.sinLimpiar || !mismoBuffer) {
      ctx.clearRect(0, 0, pxW, pxH);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) {
      ctx.imageSmoothingQuality = "high";
    }

    return { ctx, w: ancho, h: alto, dpr };
  }

  function observarRedimension(canvas, dibujar, alturaLogica) {
    let frame = null;
    const ejecutar = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        prepararCanvasHD(canvas, alturaLogica);
        dibujar();
      });
    };
    ejecutar();
    if (global.ResizeObserver && canvas.parentElement) {
      const obs = new ResizeObserver(ejecutar);
      obs.observe(canvas.parentElement);
      canvas._resizeObs = obs;
    } else {
      global.addEventListener("resize", ejecutar);
    }
    canvas._redibujar = ejecutar;
    return ejecutar;
  }

  global.BancoCanvas = {
    preparar: prepararCanvasHD,
    observar: observarRedimension,
    obtenerDpr,
  };
})(typeof window !== "undefined" ? window : globalThis);
