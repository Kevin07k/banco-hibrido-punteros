/**
 * Instantáneas del bosque hash y listas para reproducir pasos hacia atrás.
 */
(function (global) {
  "use strict";

  const BD = () => global.BancoDoc;

  function serializarNodo(n) {
    if (!n) return null;
    return {
      cuenta: n.getCuenta(),
      nombre: n.datos.nombre,
      tipo: n.datos.tipo,
      saldo: n.datos.saldo,
      esRojo: n.esRojo,
      izq: n.izquierdo ? n.izquierdo.getCuenta() : null,
      der: n.derecho ? n.derecho.getCuenta() : null,
      padre: n.padre ? n.padre.getCuenta() : null,
      /* siguiente no se serializa: la lista del reporte va en paso.listaIds */
    };
  }

  function serializarArbol(raiz) {
    const nodos = [];
    function walk(n) {
      if (!n) return;
      walk(n.izquierdo);
      nodos.push(serializarNodo(n));
      walk(n.derecho);
    }
    walk(raiz);
    return { raizCuenta: raiz ? raiz.getCuenta() : null, nodos };
  }

  function serializarCasilleros(casilleros) {
    return casilleros.map((r) => serializarArbol(r));
  }

  function serializarLista(cabeza) {
    const ids = [];
    let n = cabeza;
    while (n) {
      ids.push(n.getCuenta());
      n = n.siguiente;
    }
    return ids;
  }

  function deserializarArbol(data) {
    if (!data || !data.raizCuenta) return null;
    const map = {};
    const { Cliente, NodoHibrido } = BD();
    data.nodos.forEach((sn) => {
      const c = new Cliente(sn.cuenta, sn.nombre, sn.tipo, sn.saldo);
      const n = new NodoHibrido(c);
      n.esRojo = sn.esRojo;
      map[sn.cuenta] = n;
    });
    data.nodos.forEach((sn) => {
      const n = map[sn.cuenta];
      n.izquierdo = sn.izq != null ? map[sn.izq] : null;
      n.derecho = sn.der != null ? map[sn.der] : null;
      n.padre = sn.padre != null ? map[sn.padre] : null;
      n.siguiente = null;
    });
    return map[data.raizCuenta];
  }

  function deserializarCasilleros(snaps) {
    return snaps.map((s) => deserializarArbol(s));
  }

  function clonarCasilleros(casilleros) {
    return deserializarCasilleros(serializarCasilleros(sincronizarRaices(casilleros)));
  }

  /** Tras rotaciones, casilleros[i] puede no apuntar a la raíz real */
  function sincronizarRaices(casilleros) {
    const obtenerRaiz = BD().obtenerRaiz;
    return casilleros.map((raiz) => (raiz ? obtenerRaiz(raiz) : null));
  }

  /** Lista solo por cuentas (para vista de reporte en pasos) */
  function listaDesdeIds(casilleros, ids) {
    if (!ids || !ids.length) return null;
    const map = {};
    function indexar(n) {
      if (!n) return;
      map[n.getCuenta()] = n;
      indexar(n.izquierdo);
      indexar(n.derecho);
    }
    casilleros.forEach(indexar);
    let cabeza = null;
    let cola = null;
    ids.forEach((id) => {
      const n = map[id];
      if (!n) return;
      n.siguiente = null;
      if (!cabeza) {
        cabeza = n;
        cola = n;
      } else {
        cola.siguiente = n;
        cola = n;
      }
    });
    return cabeza;
  }

  function serializarCasillerosSync(casilleros) {
    return serializarCasilleros(sincronizarRaices(casilleros));
  }

  global.BancoSerial = {
    serializarArbol,
    serializarCasilleros,
    serializarCasillerosSync,
    serializarLista,
    deserializarArbol,
    deserializarCasilleros,
    clonarCasilleros,
    sincronizarRaices,
    listaDesdeIds,
  };
})(typeof window !== "undefined" ? window : globalThis);
