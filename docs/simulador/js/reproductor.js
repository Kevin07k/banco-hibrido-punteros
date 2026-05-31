/**
 * Reproductor paso a paso (estilo visualización USFCA, en español).
 * En modo reproducir espera a que termine la animación del canvas antes del siguiente paso.
 */
(function (global) {
  "use strict";

  class ReproductorVisual {
    constructor(opciones) {
      this.contenedor =
        typeof opciones.contenedor === "string"
          ? document.querySelector(opciones.contenedor)
          : opciones.contenedor;
      this.alPaso = opciones.alPaso || (() => {});
      this.alTerminar = opciones.alTerminar || (() => {});
      this.pasos = [];
      this.indice = 0;
      this.velocidad = 1200;
      this._playing = false;
      this._playDelay = null;
      this._montar();
    }

    _montar() {
      this.contenedor.classList.add("reproductor-wrap");
      this.contenedor.innerHTML = `
        <div class="reproductor-barra">
          <button type="button" class="btn btn-secundario btn-icon" data-accion="inicio" title="Ir al inicio">⏮</button>
          <button type="button" class="btn btn-secundario btn-icon" data-accion="atras" title="Paso anterior">◀</button>
          <button type="button" class="btn btn-primario btn-icon" data-accion="play" title="Reproducir / Pausar">▶</button>
          <button type="button" class="btn btn-secundario btn-icon" data-accion="adelante" title="Paso siguiente">▶</button>
          <button type="button" class="btn btn-secundario btn-icon" data-accion="fin" title="Ir al final">⏭</button>
          <label class="reproductor-vel">
            Velocidad
            <input type="range" min="300" max="2500" step="100" value="1200" data-accion="velocidad" />
          </label>
          <span class="reproductor-contador" data-ref="contador">0 / 0</span>
        </div>
        <div class="reproductor-decision" data-ref="decision">
          <span class="reproductor-paso-num" data-ref="pasoNum">—</span>
          <strong data-ref="titulo">Ejecuta una operación para ver la animación</strong>
          <p data-ref="detalle"></p>
        </div>
        <div class="reproductor-timeline-wrap">
          <input type="range" class="reproductor-timeline" data-accion="timeline" min="0" max="0" value="0" />
        </div>
      `;

      this.contenedor.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-accion]");
        if (!btn) return;
        const a = btn.dataset.accion;
        if (a === "inicio") this.irA(0);
        else if (a === "fin") this.irA(this.pasos.length - 1);
        else if (a === "atras") this.atras();
        else if (a === "adelante") this.adelante();
        else if (a === "play") this.alternarPlay();
      });

      this.contenedor.querySelector("[data-accion=velocidad]").addEventListener("input", (e) => {
        this.velocidad = 2800 - parseInt(e.target.value, 10);
      });

      this.contenedor.querySelector("[data-accion=timeline]").addEventListener("input", (e) => {
        this.pausar();
        this.irA(parseInt(e.target.value, 10), { instantaneo: true });
      });

      this.ref = {};
      this.contenedor.querySelectorAll("[data-ref]").forEach((el) => {
        this.ref[el.dataset.ref] = el;
      });
      this.btnPlay = this.contenedor.querySelector('[data-accion="play"]');
    }

    _limpiarPlayDelay() {
      if (this._playDelay) {
        clearTimeout(this._playDelay);
        this._playDelay = null;
      }
    }

    cargarPasos(pasos) {
      this.pausar();
      this.pasos = pasos || [];
      this.indice = 0;
      const tl = this.contenedor.querySelector("[data-accion=timeline]");
      const max = Math.max(0, this.pasos.length - 1);
      tl.max = max;
      tl.value = 0;
      this._actualizarContador();
      if (this.pasos.length) return this.irA(0);
      this._mostrarMensajeVacio();
      return Promise.resolve();
    }

    _mostrarMensajeVacio() {
      this.ref.titulo.textContent = "Sin pasos — ejecuta una operación";
      this.ref.detalle.textContent = "";
      this.ref.pasoNum.textContent = "—";
      this.ref.decision.className = "reproductor-decision";
    }

    _actualizarContador() {
      this.ref.contador.textContent =
        this.pasos.length ? `${this.indice + 1} / ${this.pasos.length}` : "0 / 0";
      const tl = this.contenedor.querySelector("[data-accion=timeline]");
      tl.value = this.indice;
    }

    irA(i, opts) {
      if (!this.pasos.length) return Promise.resolve();
      this.indice = Math.max(0, Math.min(i, this.pasos.length - 1));
      const paso = this.pasos[this.indice];
      this._actualizarContador();
      this._mostrarPaso(paso);

      const ret = this.alPaso(paso, this.indice, opts);
      const promesa = ret && typeof ret.then === "function" ? ret : Promise.resolve();

      return promesa.then(() => {
        if (this.indice === this.pasos.length - 1) this.alTerminar(paso);
      });
    }

    _mostrarPaso(paso) {
      this.ref.pasoNum.textContent = `Paso ${this.indice + 1}`;
      this.ref.titulo.textContent = paso.titulo || paso.decision || "";
      this.ref.detalle.textContent = paso.detalle || "";
      const panel = this.ref.decision;
      panel.className = "reproductor-decision tipo-" + (paso.tipo || "default");
      let badge = panel.querySelector(".badge-decision");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "badge-decision";
        panel.insertBefore(badge, panel.firstChild);
      }
      badge.textContent = paso.decision || paso.tipo || "Paso";

      let est = panel.querySelector(".tag-estructura-paso");
      if (paso.estructura) {
        if (!est) {
          est = document.createElement("span");
          est.className = "tag-estructura tag-estructura-paso";
          panel.insertBefore(est, badge.nextSibling);
        }
        est.className = "tag-estructura tag-estructura-paso " + paso.estructura;
        const labels = { hash: "Tabla hash", arbol: "Árbol RBT", lista: "Lista siguiente", fachada: "Fachada" };
        est.textContent = labels[paso.estructura] || paso.estructura;
        est.style.display = "inline-block";
      } else if (est) {
        est.style.display = "none";
      }
    }

    atras() {
      this.pausar();
      if (this.indice > 0) return this.irA(this.indice - 1, { instantaneo: true });
      return Promise.resolve();
    }

    adelante() {
      this.pausar();
      if (this.indice < this.pasos.length - 1) {
        return this.irA(this.indice + 1, { instantaneo: true });
      }
      return Promise.resolve();
    }

    alternarPlay() {
      if (this._playing) this.pausar();
      else this.reproducir();
    }

    _continuarPlay() {
      if (!this._playing) return;
      if (this.indice >= this.pasos.length - 1) {
        this.pausar();
        return;
      }
      const siguiente = this.indice + 1;
      this.irA(siguiente).then(() => {
        if (!this._playing) return;
        this._playDelay = setTimeout(() => this._continuarPlay(), Math.max(this.velocidad, 420));
      });
    }

    reproducir() {
      if (!this.pasos.length) return;
      this._playing = true;
      this.btnPlay.textContent = "⏸";
      this.btnPlay.title = "Pausar";
      this._limpiarPlayDelay();

      if (this.indice >= this.pasos.length - 1) {
        this.irA(0).then(() => {
          if (this._playing) {
            this._playDelay = setTimeout(() => this._continuarPlay(), Math.max(this.velocidad, 420));
          }
        });
      } else {
        this._playDelay = setTimeout(() => this._continuarPlay(), Math.max(this.velocidad, 420));
      }
    }

    pausar() {
      this._playing = false;
      this._limpiarPlayDelay();
      this.btnPlay.textContent = "▶";
      this.btnPlay.title = "Reproducir";
    }
  }

  global.ReproductorVisual = ReproductorVisual;
})(typeof window !== "undefined" ? window : globalThis);
