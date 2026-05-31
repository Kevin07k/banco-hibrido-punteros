/**
 * Escenarios prearmados: bosques hash+RBT listos para animar solo el reporte.
 */
(function (global) {
  "use strict";

  const ESCENARIOS = [
    {
      id: "demo",
      nombre: "Demo Main.java (4)",
      descripcion: "Mismos clientes que Main.java — pocos nodos, ideal para empezar.",
      tamano: 7,
      clientes: [
        [1003, "Ana Lopez", "Ahorro", 1500.5],
        [1001, "Carlos Ruiz", "Corriente", 3200],
        [1002, "Maria Gomez", "Ahorro", 780.25],
        [1204, "Pedro Diaz", "Corriente", 9100],
      ],
    },
    {
      id: "siete-baldes",
      nombre: "7 baldes distintos",
      descripcion: "Un cliente por casillero (cuentas 1001–1007). Inorden por balde antes del merge global.",
      tamano: 7,
      clientes: [
        [1001, "C1", "Ahorro", 100],
        [1002, "C2", "Ahorro", 200],
        [1003, "C3", "Ahorro", 300],
        [1004, "C4", "Ahorro", 400],
        [1005, "C5", "Ahorro", 500],
        [1006, "C6", "Ahorro", 600],
        [1007, "C7", "Ahorro", 700],
      ],
    },
    {
      id: "colision",
      nombre: "Un balde — colisiones (6)",
      descripcion: "Todas las cuentas caen en casillero [0] con tamaño 7 → un solo árbol RBT grande.",
      tamano: 7,
      clientes: [
        [1001, "A", "Ahorro", 100],
        [1008, "B", "Ahorro", 200],
        [1015, "C", "Ahorro", 300],
        [1022, "D", "Ahorro", 400],
        [1029, "E", "Ahorro", 500],
        [1036, "F", "Ahorro", 600],
      ],
    },
    {
      id: "merge-8",
      nombre: "Reporte mediano (8)",
      descripcion: "Ocho cuentas repartidas en varios baldes — buen árbol de recursión MergeSort.",
      tamano: 7,
      clientes: [
        [1003, "N1", "Corriente", 100],
        [1001, "N2", "Corriente", 200],
        [1002, "N3", "Ahorro", 300],
        [1204, "N4", "Corriente", 400],
        [1005, "N5", "Ahorro", 500],
        [1010, "N6", "Ahorro", 600],
        [1015, "N7", "Corriente", 700],
        [1020, "N8", "Ahorro", 800],
      ],
    },
    {
      id: "merge-12",
      nombre: "Reporte grande (12)",
      descripcion: "Doce clientes — merge más profundo (más pasos en el canvas de recursión).",
      tamano: 7,
      clientes: [
        [1050, "P1", "Ahorro", 100],
        [1003, "P2", "Ahorro", 200],
        [1001, "P3", "Corriente", 300],
        [1002, "P4", "Ahorro", 400],
        [1204, "P5", "Corriente", 500],
        [1005, "P6", "Ahorro", 600],
        [1010, "P7", "Corriente", 700],
        [1015, "P8", "Ahorro", 800],
        [1020, "P9", "Corriente", 900],
        [1025, "P10", "Ahorro", 1000],
        [1030, "P11", "Corriente", 1100],
        [1035, "P12", "Ahorro", 1200],
      ],
    },
    {
      id: "dos-baldes",
      nombre: "2 baldes cargados",
      descripcion: "Colisión en [0] y [1] por separado — dos árboles antes de unir el reporte.",
      tamano: 7,
      clientes: [
        [1001, "H0a", "Ahorro", 100],
        [1008, "H0b", "Ahorro", 200],
        [1015, "H0c", "Ahorro", 300],
        [1002, "H1a", "Corriente", 400],
        [1009, "H1b", "Corriente", 500],
        [1016, "H1c", "Corriente", 600],
      ],
    },
  ];

  function obtener(id) {
    return ESCENARIOS.find((e) => e.id === id) || ESCENARIOS[0];
  }

  function lista() {
    return ESCENARIOS.map((e) => ({ id: e.id, nombre: e.nombre, descripcion: e.descripcion }));
  }

  /** Inserta en silencio (sin pasos de animación) y devuelve casilleros sincronizados. */
  function construirCasilleros(escenario) {
    const BD = global.BancoDoc;
    const BS = global.BancoSerial;
    const tam = escenario.tamano || 7;
    const cas = new Array(tam).fill(null);
    const { Cliente, NodoHibrido, insertar } = BD;

    escenario.clientes.forEach(([cuenta, nombre, tipo, saldo]) => {
      const idx = BD.calcularIndice(cuenta, tam);
      const n = new NodoHibrido(new Cliente(cuenta, nombre, tipo, saldo));
      cas[idx] = insertar(cas[idx], n);
    });

    return { casilleros: BS.sincronizarRaices(cas), tamano: tam, total: escenario.clientes.length };
  }

  function resumenBaldes(casilleros) {
    const BD = global.BancoDoc;
    const partes = [];
    for (let i = 0; i < casilleros.length; i++) {
      if (casilleros[i]) partes.push(`[${i}]: ${BD.contar(casilleros[i])} nodo(s)`);
    }
    return partes.length ? partes.join(" · ") : "sin datos";
  }

  global.BancoEscenarios = {
    ESCENARIOS,
    obtener,
    lista,
    construirCasilleros,
    resumenBaldes,
  };
})(typeof window !== "undefined" ? window : globalThis);
