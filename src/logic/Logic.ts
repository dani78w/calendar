export class Tarea {
    texto: string;
    fecha: string;
    hora: string;
  
    constructor(texto: string) {
      this.texto = texto;
      const fechaActual = new Date();
      this.fecha = fechaActual.toLocaleDateString();
      this.hora = fechaActual.toLocaleTimeString();
    }
  }
  
  export class Dia {
    id?: number; // El id es opcional y será asignado por IndexedDB
    dia: number;
    mes: number;
    anio: number;
    tareas: Tarea[];
  
    constructor(dia: number, mes: number, anio: number) {
      this.dia = dia;
      this.mes = mes;
      this.anio = anio;
      this.tareas = [];
    }
  
    agregarTarea(texto: string) {
      const nuevaTarea = new Tarea(texto);
      this.tareas.push(nuevaTarea);
    }
  }
  
  // Funciones para interactuar con IndexedDB
  export async function abrirBaseDeDatos() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("tareasDiarias", 1);
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("dias")) {
          const objectStore = db.createObjectStore("dias", { keyPath: "id", autoIncrement: true });
          objectStore.createIndex("fecha", ["dia", "mes", "anio"], { unique: true });
        }
      };
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  export async function cargarDias() {
    const db = await abrirBaseDeDatos();
    const transaction = db.transaction(["dias"], "readonly");
    const objectStore = transaction.objectStore("dias");
    const request = objectStore.getAll();
  
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  export async function buscarDia(dia: number, mes: number, anio: number) {
    const db = await abrirBaseDeDatos();
    const transaction = db.transaction(["dias"], "readonly");
    const objectStore = transaction.objectStore("dias");
    const index = objectStore.index("fecha");
  
    return new Promise((resolve, reject) => {
      const request = index.get([dia, mes, anio]);
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  export async function guardarDia(dia: Dia) {
    const db = await abrirBaseDeDatos();
    const transaction = db.transaction(["dias"], "readwrite");
    const objectStore = transaction.objectStore("dias");
  
    // Asegúrate de que no se está pasando un id inválido
    if (!dia.id) {
      delete dia.id; // Elimina el id si es undefined o null
    }
  
    return new Promise((resolve, reject) => {
      const request = objectStore.put(dia); // IndexedDB generará el id automáticamente si no existe
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }