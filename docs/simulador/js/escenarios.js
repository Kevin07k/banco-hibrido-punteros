/**
 * Escenarios prearmados: bosques hash+RBT listos para animar solo el reporte.
 */
(function (global) {
  "use strict";

  const ESCENARIOS = [
    {
      id: "demo",
      nombre: "Demo Main + ampliado (10)",
      descripcion:
        "Los 4 de Main.java más 6 cuentas extra en varios casilleros — buen punto de partida con datos visibles.",
      tamano: 7,
      clientes: [
        [1003, "Ana Lopez", "Ahorro", 1500.5],
        [1001, "Carlos Ruiz", "Corriente", 3200],
        [1002, "Maria Gomez", "Ahorro", 780.25],
        [1204, "Pedro Diaz", "Corriente", 9100],
        [1005, "Laura Vega", "Ahorro", 2100],
        [1010, "Miguel Soto", "Corriente", 4400],
        [1015, "Elena Rios", "Ahorro", 990],
        [1020, "Jorge Mena", "Corriente", 12500],
        [1025, "Paula Nieto", "Ahorro", 650],
        [1030, "Raul Paredes", "Corriente", 3800],
      ],
    },
    {
      id: "siete-baldes",
      nombre: "7 baldes + refuerzo (11)",
      descripcion:
        "Un cliente base por casillero y colisiones extra en [2] y [5] — varios árboles medianos.",
      tamano: 7,
      clientes: [
        [1001, "C1 Norte", "Ahorro", 100],
        [1002, "C2 Norte", "Ahorro", 200],
        [1003, "C3 Norte", "Ahorro", 300],
        [1004, "C4 Norte", "Ahorro", 400],
        [1005, "C5 Norte", "Ahorro", 500],
        [1006, "C6 Norte", "Ahorro", 600],
        [1007, "C7 Norte", "Ahorro", 700],
        [1010, "C3 colisión", "Corriente", 310],
        [1017, "C3 colisión 2", "Corriente", 320],
        [1026, "C5 colisión", "Ahorro", 510],
        [1033, "C5 colisión 2", "Ahorro", 520],
      ],
    },
    {
      id: "colision",
      nombre: "Colisión extrema — 10 en [0]",
      descripcion:
        "Diez cuentas con el mismo índice hash (casillero [0], tamaño 7). Árbol RBT muy profundo en un solo balde — stress máximo razonable.",
      tamano: 7,
      clientes: [
        [1001, "Col 01", "Ahorro", 100],
        [1008, "Col 02", "Ahorro", 200],
        [1015, "Col 03", "Ahorro", 300],
        [1022, "Col 04", "Ahorro", 400],
        [1029, "Col 05", "Ahorro", 500],
        [1036, "Col 06", "Corriente", 600],
        [1043, "Col 07", "Corriente", 700],
        [1050, "Col 08", "Ahorro", 800],
        [1057, "Col 09", "Corriente", 900],
        [1064, "Col 10", "Ahorro", 1000],
      ],
    },
    {
      id: "colision-10-mas-7",
      nombre: "10 en [0] + 7 en [2] (17)",
      descripcion:
        "Colisión fuerte en [0] y segundo árbol grande en [2] — dos baldes cargados antes del reporte global.",
      tamano: 7,
      clientes: [
        [1001, "H0-01", "Ahorro", 100],
        [1008, "H0-02", "Ahorro", 200],
        [1015, "H0-03", "Ahorro", 300],
        [1022, "H0-04", "Corriente", 400],
        [1029, "H0-05", "Ahorro", 500],
        [1036, "H0-06", "Corriente", 600],
        [1043, "H0-07", "Ahorro", 700],
        [1050, "H0-08", "Corriente", 800],
        [1057, "H0-09", "Ahorro", 900],
        [1064, "H0-10", "Corriente", 1000],
        [1003, "H2-01", "Corriente", 1100],
        [1010, "H2-02", "Corriente", 1200],
        [1017, "H2-03", "Ahorro", 1300],
        [1024, "H2-04", "Corriente", 1400],
        [1031, "H2-05", "Ahorro", 1500],
        [1038, "H2-06", "Corriente", 1600],
        [1045, "H2-07", "Ahorro", 1700],
      ],
    },
    {
      id: "colision-10-mas-5",
      nombre: "10 en [0] + 5 en [5] (15)",
      descripcion:
        "Máxima colisión en [0] más un balde secundario con cinco nodos en [5] — buen mix sin pasarse de un solo árbol.",
      tamano: 7,
      clientes: [
        [1001, "H0-01", "Ahorro", 100],
        [1008, "H0-02", "Ahorro", 200],
        [1015, "H0-03", "Ahorro", 300],
        [1022, "H0-04", "Ahorro", 400],
        [1029, "H0-05", "Corriente", 500],
        [1036, "H0-06", "Corriente", 600],
        [1043, "H0-07", "Ahorro", 700],
        [1050, "H0-08", "Corriente", 800],
        [1057, "H0-09", "Ahorro", 900],
        [1064, "H0-10", "Corriente", 1000],
        [1006, "H5-01", "Ahorro", 1100],
        [1013, "H5-02", "Corriente", 1200],
        [1020, "H5-03", "Ahorro", 1300],
        [1027, "H5-04", "Corriente", 1400],
        [1034, "H5-05", "Ahorro", 1500],
      ],
    },
    {
      id: "stress-10-7-5",
      nombre: "Stress hash 10+7+5 (22)",
      descripcion:
        "Tres baldes pesados: 10 colisiones en [0], 7 en [1], 5 en [3]. Reporte y merge con mucha carga visual.",
      tamano: 7,
      clientes: [
        [1001, "S0-01", "Ahorro", 100],
        [1008, "S0-02", "Ahorro", 200],
        [1015, "S0-03", "Ahorro", 300],
        [1022, "S0-04", "Corriente", 400],
        [1029, "S0-05", "Ahorro", 500],
        [1036, "S0-06", "Corriente", 600],
        [1043, "S0-07", "Ahorro", 700],
        [1050, "S0-08", "Corriente", 800],
        [1057, "S0-09", "Ahorro", 900],
        [1064, "S0-10", "Corriente", 1000],
        [1002, "S1-01", "Corriente", 1100],
        [1009, "S1-02", "Corriente", 1200],
        [1016, "S1-03", "Ahorro", 1300],
        [1023, "S1-04", "Corriente", 1400],
        [1030, "S1-05", "Ahorro", 1500],
        [1037, "S1-06", "Corriente", 1600],
        [1044, "S1-07", "Ahorro", 1700],
        [1004, "S3-01", "Ahorro", 1800],
        [1011, "S3-02", "Corriente", 1900],
        [1018, "S3-03", "Ahorro", 2000],
        [1025, "S3-04", "Corriente", 2100],
        [1032, "S3-05", "Ahorro", 2200],
      ],
    },
    {
      id: "merge-8",
      nombre: "Reporte mediano (14)",
      descripcion: "Catorce clientes en 5–6 baldes — recursión MergeSort visible sin ser enorme.",
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
        [1025, "N9", "Corriente", 900],
        [1030, "N10", "Ahorro", 1000],
        [1035, "N11", "Corriente", 1100],
        [1040, "N12", "Ahorro", 1200],
        [1045, "N13", "Corriente", 1300],
        [1050, "N14", "Ahorro", 1400],
      ],
    },
    {
      id: "merge-12",
      nombre: "Reporte grande (18)",
      descripcion: "Dieciocho clientes — merge profundo y lista final larga en el canvas.",
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
        [1040, "P13", "Corriente", 1300],
        [1045, "P14", "Ahorro", 1400],
        [1055, "P15", "Corriente", 1500],
        [1060, "P16", "Ahorro", 1600],
        [1065, "P17", "Corriente", 1700],
        [1070, "P18", "Ahorro", 1800],
      ],
    },
    {
      id: "dos-baldes",
      nombre: "2 baldes × 7 (14)",
      descripcion: "Siete colisiones en [0] y siete en [1] — dos árboles RBT grandes, sin amontonar 15 en un solo balde.",
      tamano: 7,
      clientes: [
        [1001, "H0-01", "Ahorro", 100],
        [1008, "H0-02", "Ahorro", 200],
        [1015, "H0-03", "Ahorro", 300],
        [1022, "H0-04", "Corriente", 400],
        [1029, "H0-05", "Ahorro", 500],
        [1036, "H0-06", "Corriente", 600],
        [1043, "H0-07", "Ahorro", 700],
        [1002, "H1-01", "Corriente", 800],
        [1009, "H1-02", "Corriente", 900],
        [1016, "H1-03", "Corriente", 1000],
        [1023, "H1-04", "Ahorro", 1100],
        [1030, "H1-05", "Corriente", 1200],
        [1037, "H1-06", "Ahorro", 1300],
        [1044, "H1-07", "Corriente", 1400],
      ],
    },
    {
      id: "tres-baldes-5",
      nombre: "3 baldes × 5 (15)",
      descripcion: "Cinco cuentas en [2], [4] y [6] — colisión moderada repartida, sin un solo balde gigante.",
      tamano: 7,
      clientes: [
        [1003, "B2-01", "Ahorro", 100],
        [1010, "B2-02", "Corriente", 200],
        [1017, "B2-03", "Ahorro", 300],
        [1024, "B2-04", "Corriente", 400],
        [1031, "B2-05", "Ahorro", 500],
        [1005, "B4-01", "Corriente", 600],
        [1012, "B4-02", "Ahorro", 700],
        [1019, "B4-03", "Corriente", 800],
        [1026, "B4-04", "Ahorro", 900],
        [1033, "B4-05", "Corriente", 1000],
        [1007, "B6-01", "Ahorro", 1100],
        [1014, "B6-02", "Corriente", 1200],
        [1021, "B6-03", "Ahorro", 1300],
        [1028, "B6-04", "Corriente", 1400],
        [1035, "B6-05", "Ahorro", 1500],
      ],
    },
    {
      id: "curso-20",
      nombre: "Curso completo (20)",
      descripcion: "Veinte cuentas repartidas en todos los casilleros — máximo realista para practicar el reporte.",
      tamano: 7,
      clientes: [
        [1001, "Alumno 01", "Ahorro", 100],
        [1002, "Alumno 02", "Corriente", 200],
        [1003, "Alumno 03", "Ahorro", 300],
        [1004, "Alumno 04", "Corriente", 400],
        [1005, "Alumno 05", "Ahorro", 500],
        [1006, "Alumno 06", "Corriente", 600],
        [1007, "Alumno 07", "Ahorro", 700],
        [1008, "Alumno 08", "Corriente", 800],
        [1009, "Alumno 09", "Ahorro", 900],
        [1010, "Alumno 10", "Corriente", 1000],
        [1011, "Alumno 11", "Ahorro", 1100],
        [1012, "Alumno 12", "Corriente", 1200],
        [1013, "Alumno 13", "Ahorro", 1300],
        [1014, "Alumno 14", "Corriente", 1400],
        [1015, "Alumno 15", "Ahorro", 1500],
        [1016, "Alumno 16", "Corriente", 1600],
        [1017, "Alumno 17", "Ahorro", 1700],
        [1018, "Alumno 18", "Corriente", 1800],
        [1019, "Alumno 19", "Ahorro", 1900],
        [1020, "Alumno 20", "Corriente", 2000],
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
    const { Cliente, NodoHibrido, insertar, encadenarAlFinal } = BD;
    let cabeza = null;
    let cola = null;

    escenario.clientes.forEach(([cuenta, nombre, tipo, saldo]) => {
      const idx = BD.calcularIndice(cuenta, tam);
      const n = new NodoHibrido(new Cliente(cuenta, nombre, tipo, saldo));
      cas[idx] = insertar(cas[idx], n);
      const ext = encadenarAlFinal(cabeza, cola, n);
      cabeza = ext.cabeza;
      cola = ext.cola;
    });

    const sinc = BS.sincronizarRaices(cas);
    const listaIds = BS.serializarLista(cabeza);
    return {
      casilleros: sinc,
      tamano: tam,
      total: escenario.clientes.length,
      listaIds,
      reporte: { cabeza, cola },
      reporteOrdenado: false,
    };
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
