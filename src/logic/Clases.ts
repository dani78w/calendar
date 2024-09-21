import React, { useState, useEffect } from "react";

// Función para abrir la base de datos IndexedDB
function abrirBaseDeDatos() {
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

// Función para cargar los días desde IndexedDB
async function cargarDias() {
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

// Función para guardar o actualizar un día en IndexedDB
async function guardarDia(dia) {
  const db = await abrirBaseDeDatos();
  const transaction = db.transaction(["dias"], "readwrite");
  const objectStore = transaction.objectStore("dias");
  return new Promise((resolve, reject) => {
    const request = objectStore.put(dia);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

// Clase Tarea
class Tarea {
  constructor(texto) {
    this.texto = texto;
    const fechaActual = new Date();
    this.fecha = fechaActual.toLocaleDateString();
    this.hora = fechaActual.toLocaleTimeString();
  }
}

// Clase Dia
class Dia {
  constructor(dia, mes, anio) {
    this.dia = dia;
    this.mes = mes;
    this.anio = anio;
    this.tareas = [];
  }

  agregarTarea(texto) {
    const nuevaTarea = new Tarea(texto);
    this.tareas.push(nuevaTarea);
  }
}

// Componente principal de React
const App = () => {
  const [dias, setDias] = useState([]);
  const [nuevoTextoTarea, setNuevoTextoTarea] = useState("");

  // Efecto para cargar los días al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      const diasAlmacenados = await cargarDias();
      if (diasAlmacenados.length === 0) {
        const hoy = new Date();
        const diaHoy = new Dia(hoy.getDate(), hoy.getMonth() + 1, hoy.getFullYear());
        await guardarDia(diaHoy);
        setDias([diaHoy]);
      } else {
        setDias(diasAlmacenados);
      }
    };

    cargarDatos();
  }, []);

  // Función para añadir una nueva tarea al día actual
  const agregarTareaAlDia = async (dia) => {
    dia.agregarTarea(nuevoTextoTarea);
    await guardarDia(dia);
    setNuevoTextoTarea(""); // Limpiar el input
    setDias([...dias]); // Forzar actualización del estado
  };

  return (
    <div>
      <h1>Tareas Diarias</h1>
      {dias.length === 0 ? (
        <p>No hay días almacenados. Se ha creado el día de hoy.</p>
      ) : (
        <div>
          {dias.map((dia, index) => (
            <div key={index}>
              <h2>{`Día: ${dia.dia}/${dia.mes}/${dia.anio}`}</h2>
              <ul>
                {dia.tareas.length > 0 ? (
                  dia.tareas.map((tarea, i) => (
                    <li key={i}>
                      {tarea.texto} - {tarea.fecha} {tarea.hora}
                    </li>
                  ))
                ) : (
                  <li>No hay tareas para este día.</li>
                )}
              </ul>
              <input
                type="text"
                placeholder="Nueva tarea"
                value={nuevoTextoTarea}
                onChange={(e) => setNuevoTextoTarea(e.target.value)}
              />
              <button onClick={() => agregarTareaAlDia(dia)}>Agregar Tarea</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;