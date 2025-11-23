import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const Column = ({ id, title, color, children, count }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-4 transition-colors ${
        isOver ? 'bg-opacity-80' : ''
      } ${color}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {count !== undefined && (
          <span className="px-2 py-1 text-sm font-medium text-gray-700 bg-white rounded-full">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

export default Column;
