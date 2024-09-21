import React from 'react';
import { Tarea } from '../logic/Logic';

interface TareaItemProps {
  tarea: Tarea;
}

const TareaItem: React.FC<TareaItemProps> = ({ tarea }) => {
  return (
    <li>
      {tarea.texto} - {tarea.fecha} {tarea.hora}
    </li>
  );
};

export default TareaItem;