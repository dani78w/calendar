import React, { useState } from 'react';
import { Dia, guardarDia } from '../logic/Logic';
import TareaItem from './TareaItem';

interface DiaItemProps {
  dia: Dia;
  actualizarDias: () => void;
}

const DiaItem: React.FC<DiaItemProps> = ({ dia, actualizarDias }) => {
  const [nuevaTarea, setNuevaTarea] = useState('');

  const agregarTarea = async () => {
    if (nuevaTarea.trim()) {
      dia.agregarTarea(nuevaTarea);
      await guardarDia(dia);
      setNuevaTarea('');
      actualizarDias(); // Llamar para recargar los días
    }
  };

  return (
    <div>
      <h2>{`Día: ${dia.dia}/${dia.mes}/${dia.anio}`}</h2>
      <ul>
        {dia.tareas.length > 0 ? (
          dia.tareas.map((tarea, index) => <TareaItem key={index} tarea={tarea} />)
        ) : (
          <li>No hay tareas para este día.</li>
        )}
      </ul>
      <input
        type="text"
        placeholder="Nueva tarea"
        value={nuevaTarea}
        onChange={(e) => setNuevaTarea(e.target.value)}
      />
      <button onClick={agregarTarea}>Agregar Tarea</button>
    </div>
  );
};

export default DiaItem;