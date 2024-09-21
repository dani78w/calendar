import React, { useState, useEffect } from "react";
import { Navbar } from "@nextui-org/navbar";
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

// Función para buscar un día existente en IndexedDB
async function buscarDia(dia: number, mes: number, anio: number) {
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

// Función para guardar o actualizar un día en IndexedDB
async function guardarDia(dia: Dia) {
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

// Clase Tarea
class Tarea {
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

  // Método para obtener el nombre del día de la semana
  obtenerNombreDelDia(): string {
    const fecha = new Date(this.anio, this.mes - 1, this.dia); // Crear fecha basada en día, mes, año
    return fecha.toLocaleDateString('es-ES', { weekday: 'long' }); // Devuelve el nombre del día en español
  }
}
// Función para convertir un objeto a instancia de Dia
function convertirEnDia(objeto: any): Dia {
  const dia = new Dia(objeto.dia, objeto.mes, objeto.anio);
  dia.id = objeto.id; // Solo copiamos el id si ya existe
  dia.tareas = objeto.tareas; // Mantener las tareas originales
  return dia;
}

// Componente principal de React
const Neo = () => {
  const [dias, setDias] = useState<Dia[]>([]);
  const [nuevoTextoTarea, setNuevoTextoTarea] = useState("");

  // Efecto para cargar los días al iniciar y verificar si el día actual existe
  useEffect(() => {
    const cargarDatos = async () => {
      const hoy = new Date();
      const diaHoy = hoy.getDate();
      const mesHoy = hoy.getMonth() + 1;
      const anioHoy = hoy.getFullYear();

      // Verificar si el día actual ya existe
      const diaExistente = await buscarDia(diaHoy, mesHoy, anioHoy);

      if (!diaExistente) {
        // Si el día no existe, lo creamos y lo guardamos en IndexedDB
        const nuevoDiaHoy = new Dia(diaHoy, mesHoy, anioHoy);
        await guardarDia(nuevoDiaHoy);
        setDias([nuevoDiaHoy]);
      } else {
        // Si existe, cargamos todos los días almacenados
        const diasAlmacenados = await cargarDias();
        const diasConvertidos = diasAlmacenados.map((dia: any) => convertirEnDia(dia));
        setDias(diasConvertidos);
      }
    };

    cargarDatos();
  }, []);

  // Función para añadir una nueva tarea al día actual
  const agregarTareaAlDia = async (dia: Dia) => {
    dia.agregarTarea(nuevoTextoTarea);

    // Guardar en IndexedDB (verificando si ya existe)
    const diaExistente = await buscarDia(dia.dia, dia.mes, dia.anio);

    if (diaExistente) {
      // Si el día ya existe en la base de datos, actualizamos su ID y tareas
      dia.id = diaExistente.id; // Copiamos el ID del día existente
    }

    await guardarDia(dia); // Guardar o actualizar el día en IndexedDB
    setNuevoTextoTarea(""); // Limpiar el input
    setDias([...dias]); // Actualizar el estado con el nuevo array de días
  };

  return (
    <div className="flex align-middle items-center justify-center">
    <div className="p-4 max-w-[600px] w-full">
      {dias.length === 0 ? (
        <p className="">No hay días almacenados. Se ha creado el día de hoy.</p>
      ) : (
        <div>
          {dias.map((dia, index) => (
            <div key={index} className="">
              <div className="border p-2 mt-1 mb-1">
                
                <div  className="flex flex-row">
                  <p className=" color-blue-300 text-2xl">{dia.obtenerNombreDelDia().toUpperCase()}</p> 
                  <p className=" pl-1 text-2xl font-thin "> {dia.dia} </p>
                </div>
                <h2 className="  font-thin">{`${dia.mes}/${dia.anio}`}</h2>
              </div>
              <div className="border p-1">
                <ul>
                  {dia.tareas.length > 0 ? (
                    dia.tareas.map((tarea, i) => (
                      <li key={i}>
                        
                        <div className="flex flex-row p-2 items-middle justfy-middle items-center">
                          <p class="hora" > {tarea.hora} </p>
                          <p className=" p-3">{tarea.texto}</p>
                        </div>
                      
                      </li>
                    ))
                  ) : (
                    <li className="p-3">No hay tareas para este día.</li>
                  )}
                </ul>
                
                <div className="flex flex-row bg-slate-100 min-h-[40px] justfy-middle items-center p-2">
                  <input
                  className="bg-slate-100 flex-1 h-full p-3"
                  type="text"
                  placeholder="Nueva tarea"
                  value={nuevoTextoTarea}
                  onChange={(e) => setNuevoTextoTarea(e.target.value)}
                />
                <button className="w-[24px] hover:bg-slate-200 radius-xl transition-all animate-all" onClick={() => agregarTareaAlDia(dia)}>
                <svg  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>



                </button>
                </div>

              </div>
              
              
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default Neo;