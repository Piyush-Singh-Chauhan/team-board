import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiCalendar, FiFlag, FiX, FiUser, FiEdit2 } from 'react-icons/fi';
import { format } from 'date-fns';

const Card = ({ card, onDelete, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && card.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow relative"
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing pr-8">
        <h3 className="font-semibold text-gray-900 mb-2 truncate" title={card.title}>{card.title}</h3>
        {card.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={card.description}>{card.description}</p>
        )}
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (onEdit) onEdit(card);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          className="text-gray-400 hover:text-primary-600 p-1 hover:bg-gray-100 rounded"
          title="Edit card"
          type="button"
        >
          <FiEdit2 className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (onDelete) onDelete(card._id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          className="text-gray-400 hover:text-red-600 p-1 hover:bg-gray-100 rounded"
          title="Delete card"
          type="button"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        {card.priority && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(card.priority)}`}>
            <FiFlag className="h-3 w-3" />
            {card.priority}
          </span>
        )}

        {card.dueDate && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            isOverdue ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100'
          }`}>
            <FiCalendar className="h-3 w-3" />
            {format(new Date(card.dueDate), 'MMM dd')}
          </span>
        )}

        {card.assignedTo && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-600 bg-blue-100 max-w-[120px]">
            <FiUser className="h-3 w-3 flex-shrink-0" />
            <span className="truncate" title={card.assignedTo.name || 'Assigned'}>
              {card.assignedTo.name || 'Assigned'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default Card;
