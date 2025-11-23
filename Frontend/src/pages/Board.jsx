import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getBoard, moveCards as moveCardsAPI } from '../api/boards.js';
import { addCard as addCardAPI, editCard as editCardAPI, removeCard as removeCardAPI } from '../api/cards.js';
import { getTeam } from '../api/teams.js';
import { FiPlus, FiArrowLeft, FiX, FiChevronDown } from 'react-icons/fi';
import Header from '../components/header/Header.jsx';
import Column from '../components/board/Column.jsx';
import Card from '../components/board/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getAuthToken } from '../api/client.js';
import Swal from 'sweetalert2';

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();

const ensureFirstLetterCapital = (value = '') => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return '';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const validateCardTitle = (value) => {
  const title = ensureFirstLetterCapital(value);

  if (!title) {
    return 'Please enter card title';
  }

  if (title.length < 2) {
    return 'Card title must be at least 2 characters';
  }

  if (title.length > 50) {
    return 'Card title cannot exceed 50 characters';
  }

  if (!/^[A-Z][A-Za-z0-9\s'-.]*$/.test(title)) {
    return 'Card title must start with a capital letter and can include letters, numbers, spaces, apostrophes, hyphens, or periods';
  }

  return '';
};

const validateCardDescription = (value) => {
  const description = normalizeWhitespace(value);

  if (!description) {
    return '';
  }

  if (description.length > 150) {
    return 'Description cannot exceed 150 characters';
  }

  return '';
};

const validateDueDate = (value) => {
  if (!value) {
    return '';
  }

  const selectedDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return 'Due date cannot be before today';
  }

  return '';
};

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [cards, setCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [team, setTeam] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [editFieldErrors, setEditFieldErrors] = useState({ title: '', description: '' });
  const [editTouched, setEditTouched] = useState({ title: false, description: false });
  const [createFieldErrors, setCreateFieldErrors] = useState({ title: '', description: '', dueDate: '' });
  const [createTouched, setCreateTouched] = useState({ title: false, description: false, dueDate: false });
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const result = await getBoard(boardId);
      if (result.success) {
        setBoard(result.data);
        const cardsByColumn = {};
        COLUMNS.forEach((col) => {
          cardsByColumn[col.id] = [];
        });

        if (result.data.cards) {
          Object.keys(result.data.cards).forEach((columnId) => {
            cardsByColumn[columnId] = result.data.cards[columnId] || [];
          });
        }

        setCards(cardsByColumn);

        if (result.data.teamId) {
          const teamId = result.data.teamId._id || result.data.teamId;
          try {
            const teamResult = await getTeam(teamId);
            if (teamResult.success) {
              setTeam(teamResult.data);
              if (teamResult.data.members) {
                setTeamMembers(teamResult.data.members.map(m => m.userId));
              }
            }
          } catch (err) {
            console.error('Error fetching team members:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching board:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeCard = findCard(active.id);
    const overId = over.id;

    let destinationColumnId = null;
    let destinationIndex = 0;

    if (COLUMNS.find((col) => col.id === overId)) {
      destinationColumnId = overId;
      destinationIndex = cards[overId].length;
    } else {
      const overCard = findCard(overId);
      if (overCard) {
        destinationColumnId = overCard.columnId;
        destinationIndex = cards[destinationColumnId].findIndex((c) => c._id === overId);
      }
    }

    if (!destinationColumnId || activeCard.columnId === destinationColumnId && 
        cards[activeCard.columnId].findIndex((c) => c._id === active.id) === destinationIndex) {
      return;
    }

    const sourceColumnId = activeCard.columnId;
    const sourceIndex = cards[sourceColumnId].findIndex((c) => c._id === active.id);

    const newCards = { ...cards };
    const [movedCard] = newCards[sourceColumnId].splice(sourceIndex, 1);

    if (destinationColumnId === sourceColumnId) {
      newCards[destinationColumnId].splice(destinationIndex, 0, movedCard);
    } else {
      newCards[destinationColumnId].splice(destinationIndex, 0, {
        ...movedCard,
        columnId: destinationColumnId,
        status: destinationColumnId,
      });
    }

    setCards(newCards);

    try {
      await moveCardsAPI(boardId, {
        sourceColumnId,
        destinationColumnId,
        sourceIndex,
        destinationIndex,
        cardId: active.id,
      });
    } catch (err) {
      console.error('Error : ', err);
      fetchBoard();
    }
  };

  const findCard = (cardId) => {
    for (const columnId in cards) {
      const card = cards[columnId].find((c) => c._id === cardId);
      if (card) return card;
    }
    return null;
  };

  const handleCreateFieldChange = (field) => (event) => {
    const { value } = event.target;
    setCardForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate immediately on change
    let validator;
    if (field === 'title') {
      validator = validateCardTitle;
    } else if (field === 'description') {
      validator = validateCardDescription;
    } else if (field === 'dueDate') {
      validator = validateDueDate;
    }
    
    if (validator) {
      setCreateFieldErrors((prev) => ({
        ...prev,
        [field]: validator(value),
      }));
    }
  };

  const handleCreateBlur = (field) => () => {
    setCreateTouched((prev) => ({ ...prev, [field]: true }));

    let value = cardForm[field] || '';

    if (field === 'title') {
      const formatted = ensureFirstLetterCapital(value);
      if (formatted !== value) {
        setCardForm((prev) => ({ ...prev, title: formatted }));
      }
      value = formatted;
    } else if (field === 'description') {
      const normalized = normalizeWhitespace(value);
      if (normalized !== value) {
        setCardForm((prev) => ({ ...prev, description: normalized }));
      }
      value = normalized;
    }

    let validator;
    if (field === 'title') {
      validator = validateCardTitle;
    } else if (field === 'description') {
      validator = validateCardDescription;
    } else if (field === 'dueDate') {
      validator = validateDueDate;
    }

    if (validator) {
      setCreateFieldErrors((prev) => ({
        ...prev,
        [field]: validator(value),
      }));
    }
  };

  const validateCreateCardForm = () => {
    const formattedTitle = ensureFirstLetterCapital(cardForm.title);
    const normalizedDescription = normalizeWhitespace(cardForm.description);

    setCardForm((prev) => ({
      ...prev,
      title: formattedTitle,
      description: normalizedDescription,
    }));

    const newErrors = {
      title: validateCardTitle(formattedTitle),
      description: validateCardDescription(normalizedDescription),
      dueDate: validateDueDate(cardForm.dueDate),
    };

    setCreateFieldErrors(newErrors);
    setCreateTouched({ title: true, description: true, dueDate: true });

    return Object.values(newErrors).every((message) => !message);
  };

  const handleEditFieldChange = (field) => (event) => {
    const { value } = event.target;
    setCardForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate immediately on change
    const validator = field === 'title' ? validateCardTitle : validateCardDescription;
    setEditFieldErrors((prev) => ({
      ...prev,
      [field]: validator(value),
    }));
  };

  const handleEditBlur = (field) => () => {
    setEditTouched((prev) => ({ ...prev, [field]: true }));

    let value = cardForm[field] || '';

    if (field === 'title') {
      const formatted = ensureFirstLetterCapital(value);
      if (formatted !== value) {
        setCardForm((prev) => ({ ...prev, title: formatted }));
      }
      value = formatted;
    } else if (field === 'description') {
      const normalized = normalizeWhitespace(value);
      if (normalized !== value) {
        setCardForm((prev) => ({ ...prev, description: normalized }));
      }
      value = normalized;
    }

    const validator = field === 'title' ? validateCardTitle : validateCardDescription;
    setEditFieldErrors((prev) => ({
      ...prev,
      [field]: validator(value),
    }));
  };

  const validateEditCardForm = () => {
    const formattedTitle = ensureFirstLetterCapital(cardForm.title);
    const normalizedDescription = normalizeWhitespace(cardForm.description);

    setCardForm((prev) => ({
      ...prev,
      title: formattedTitle,
      description: normalizedDescription,
    }));

    const newErrors = {
      title: validateCardTitle(formattedTitle),
      description: validateCardDescription(normalizedDescription),
    };

    setEditFieldErrors(newErrors);
    setEditTouched({ title: true, description: true });

    return Object.values(newErrors).every((message) => !message);
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!validateCreateCardForm()) {
      return;
    }
    try {
      const payload = {
        title: ensureFirstLetterCapital(cardForm.title),
        description: normalizeWhitespace(cardForm.description) || undefined,
        columnId: selectedColumn,
        priority: cardForm.priority,
        dueDate: cardForm.dueDate || undefined,
        assignedTo: cardForm.assignedTo || undefined,
      };
      
      const result = await addCardAPI(boardId, payload);

      if (result.success) {
        setShowCreateModal(false);
        setCardForm({
          title: '',
          description: '',
          assignedTo: '',
          dueDate: '',
          priority: 'medium',
        });
        setCreateFieldErrors({ title: '', description: '', dueDate: '' });
        setCreateTouched({ title: false, description: false, dueDate: false });
        setCreateError('');
        await fetchBoard();
      }
    } catch (err) {
      console.error('Error :', err);
      setCreateError(err.response?.data?.message || 'Failed to create card');
    }
  };

  const handleDeleteCard = async (cardId) => {
    // Find the card to get its title for the confirmation message
    let cardTitle = 'this card';
    Object.keys(cards).forEach((columnId) => {
      const card = cards[columnId]?.find(c => c._id === cardId);
      if (card) {
        cardTitle = card.title;
      }
    });

    const result = await Swal.fire({
      title: 'Delete Card?',
      text: `Are you sure you want to delete "${cardTitle}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel',
      reverseButtons: true,
      focusConfirm: false,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const newCards = { ...cards };
      let cardRemoved = false;
      
      Object.keys(newCards).forEach((columnId) => {
        const index = newCards[columnId].findIndex(c => c._id === cardId);
        if (index !== -1) {
          newCards[columnId].splice(index, 1);
          cardRemoved = true;
        }
      });
      
      if (cardRemoved) {
        setCards(newCards);
      }

      await removeCardAPI(cardId);
      
      await Swal.fire({
        title: 'Deleted!',
        text: 'Card has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      
      await fetchBoard();
    } catch (err) {
      console.error('Error :', err);
      await Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete card. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
      await fetchBoard();
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setError('');
    setCardForm({
      title: card.title,
      description: card.description || '',
      assignedTo: card.assignedTo?._id || card.assignedTo || '',
      dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '',
      priority: card.priority || 'medium',
      status: card.status || card.columnId || 'todo',
    });
    setEditFieldErrors({ title: '', description: '' });
    setEditTouched({ title: false, description: false });
    setShowEditModal(true);
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    if (!editingCard) return;

    if (!validateEditCardForm()) {
      return;
    }

    setError('');
    try {
      const oldColumnId = editingCard.columnId;
      const newColumnId = cardForm.status;
      const cardData = {
        title: ensureFirstLetterCapital(cardForm.title),
        description: normalizeWhitespace(cardForm.description) || undefined,
        assignedTo: cardForm.assignedTo && cardForm.assignedTo.trim() !== '' ? cardForm.assignedTo : undefined,
        dueDate: cardForm.dueDate || undefined,
        priority: cardForm.priority,
        status: cardForm.status,
        columnId: cardForm.status,
      };

      const result = await editCardAPI(editingCard._id, cardData);

      if (result.success) {
        if (oldColumnId !== newColumnId) {
          const newCards = { ...cards };
          
          const oldColumnIndex = newCards[oldColumnId]?.findIndex(c => c._id === editingCard._id);
          if (oldColumnIndex !== -1 && oldColumnIndex > -1) {
            const [movedCard] = newCards[oldColumnId].splice(oldColumnIndex, 1);
            Object.assign(movedCard, result.data);
            movedCard.columnId = newColumnId;
            movedCard.status = newColumnId;
            if (!newCards[newColumnId]) {
              newCards[newColumnId] = [];
            }
            newCards[newColumnId].push(movedCard);
            setCards(newCards);
          }
        } else {
          const newCards = { ...cards };
          const columnCards = newCards[oldColumnId] || [];
          const cardIndex = columnCards.findIndex(c => c._id === editingCard._id);
          if (cardIndex !== -1 && result.data) {
            newCards[oldColumnId][cardIndex] = { ...columnCards[cardIndex], ...result.data };
            setCards(newCards);
          }
        }

        setShowEditModal(false);
        setEditingCard(null);
        setError('');
        await fetchBoard();
      } else {
        setError(result.message || 'Failed to update card');
      }
    } catch (err) {
      console.error('Error updating card:', err);
      setError(err.response?.data?.message || 'Failed to update card. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading board...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Board not found</h2>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/teams/${board.teamId._id || board.teamId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6"
        >
          <FiArrowLeft className="h-5 w-5" />
          Back to Team
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{board.name}</h1>
          {board.description && <p className="text-gray-600">{board.description}</p>}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {COLUMNS.map((column) => (
              <Column 
                key={column.id} 
                id={column.id} 
                title={column.title} 
                color={column.color}
                count={cards[column.id]?.length || 0}
              >
                <SortableContext items={cards[column.id]?.map((c) => c._id) || []} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 min-h-[200px]">
                    {cards[column.id]?.map((card) => (
                      <Card key={card._id} card={card} onDelete={handleDeleteCard} onEdit={handleEditCard} />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedColumn(column.id);
                      setCardForm({
                        title: '',
                        description: '',
                        assignedTo: '',
                        dueDate: '',
                        priority: 'medium',
                        status: 'todo',
                      });
                      setCreateFieldErrors({ title: '', description: '' });
                      setCreateTouched({ title: false, description: false });
                      setCreateError('');
                      setShowCreateModal(true);
                    }}
                    className="mt-3 w-full py-2 px-4 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Card
                  </button>
                </SortableContext>
              </Column>
            ))}
          </div>
        </DndContext>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCardForm({
            title: '',
            description: '',
            assignedTo: '',
            dueDate: '',
            priority: 'medium',
            status: 'todo',
          });
          setCreateFieldErrors({ title: '', description: '', dueDate: '' });
          setCreateTouched({ title: false, description: false, dueDate: false });
          setCreateError('');
        }}
        title="Create New Card"
      >
        <form onSubmit={handleCreateCard} className="space-y-4" noValidate>
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {createError}
            </div>
          )}
          <div>
            <label htmlFor="createCardTitle" className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              id="createCardTitle"
              type="text"
              value={cardForm.title}
              onChange={handleCreateFieldChange('title')}
              onBlur={handleCreateBlur('title')}
              className={`input ${createFieldErrors.title ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={createFieldErrors.title ? 'true' : 'false'}
              aria-describedby={createFieldErrors.title ? 'create-card-title-error' : undefined}
              placeholder="Enter card title"
              required
              maxLength={50}
              minLength={2}
            />
            {createFieldErrors.title && (
              <p id="create-card-title-error" className="mt-2 text-sm text-red-600">
                {createFieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="createCardDescription" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="createCardDescription"
              value={cardForm.description}
              onChange={handleCreateFieldChange('description')}
              onBlur={handleCreateBlur('description')}
              className={`input ${createFieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={createFieldErrors.description ? 'true' : 'false'}
              aria-describedby={createFieldErrors.description ? 'create-card-description-error' : undefined}
              rows={3}
              placeholder="Enter card description"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-gray-500">Optional, up to 150 characters</p>
            {createFieldErrors.description && (
              <p id="create-card-description-error" className="mt-2 text-sm text-red-600">
                {createFieldErrors.description}
              </p>
            )}
          </div>

          {teamMembers.length > 0 && (
            <div className="relative" style={{ zIndex: 1 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
              <div className="relative">
                <select
                  value={cardForm.assignedTo}
                  onChange={(e) => setCardForm({ ...cardForm, assignedTo: e.target.value })}
                  className="input w-full appearance-none bg-white pr-10"
                  style={{ position: 'relative' }}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member._id || member} value={member._id || member}>
                      {member.name || member.email || 'User'}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="relative" style={{ zIndex: 1 }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="relative">
              <select
                value={cardForm.priority}
                onChange={(e) => setCardForm({ ...cardForm, priority: e.target.value })}
                className="input w-full appearance-none bg-white pr-10"
                style={{ position: 'relative' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="createCardDueDate" className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              id="createCardDueDate"
              type="date"
              value={cardForm.dueDate}
              onChange={handleCreateFieldChange('dueDate')}
              onBlur={handleCreateBlur('dueDate')}
              min={new Date().toISOString().split('T')[0]}
              className={`input ${createFieldErrors.dueDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={createFieldErrors.dueDate ? 'true' : 'false'}
              aria-describedby={createFieldErrors.dueDate ? 'create-card-due-date-error' : undefined}
            />
            {createFieldErrors.dueDate && (
              <p id="create-card-due-date-error" className="mt-2 text-sm text-red-600">
                {createFieldErrors.dueDate}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setCardForm({
                  title: '',
                  description: '',
                  assignedTo: '',
                  dueDate: '',
                  priority: 'medium',
                  status: 'todo',
                });
                setCreateFieldErrors({ title: '', description: '', dueDate: '' });
                setCreateTouched({ title: false, description: false, dueDate: false });
                setCreateError('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Card
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCard(null);
          setError('');
          setCardForm({
            title: '',
            description: '',
            assignedTo: '',
            dueDate: '',
            priority: 'medium',
            status: 'todo',
          });
          setEditFieldErrors({ title: '', description: '' });
          setEditTouched({ title: false, description: false });
        }}
        title="Edit Card"
      >
        <form onSubmit={handleUpdateCard} className="space-y-4" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="editCardTitle" className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              id="editCardTitle"
              type="text"
              value={cardForm.title}
              onChange={handleEditFieldChange('title')}
              onBlur={handleEditBlur('title')}
              className={`input ${editFieldErrors.title ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={editFieldErrors.title ? 'true' : 'false'}
              aria-describedby={editFieldErrors.title ? 'edit-card-title-error' : undefined}
              placeholder="Enter card title"
              required
              maxLength={50}
              minLength={2}
            />
            {editFieldErrors.title && (
              <p id="edit-card-title-error" className="mt-2 text-sm text-red-600">
                {editFieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="editCardDescription" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="editCardDescription"
              value={cardForm.description}
              onChange={handleEditFieldChange('description')}
              onBlur={handleEditBlur('description')}
              className={`input ${editFieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              aria-invalid={editFieldErrors.description ? 'true' : 'false'}
              aria-describedby={editFieldErrors.description ? 'edit-card-description-error' : undefined}
              rows={3}
              placeholder="Enter card description"
              maxLength={150}
            />
            <p className="mt-1 text-xs text-gray-500">Optional, up to 150 characters</p>
            {editFieldErrors.description && (
              <p id="edit-card-description-error" className="mt-2 text-sm text-red-600">
                {editFieldErrors.description}
              </p>
            )}
          </div>

          <div className="relative" style={{ zIndex: 1 }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <select
                value={cardForm.status}
                onChange={(e) => setCardForm({ ...cardForm, status: e.target.value })}
                className="input w-full appearance-none bg-white pr-10"
                style={{ position: 'relative' }}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-gray-500">Changing status will move the card to the corresponding column</p>
          </div>

          <div className="relative" style={{ zIndex: 1 }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="relative">
              <select
                value={cardForm.priority}
                onChange={(e) => setCardForm({ ...cardForm, priority: e.target.value })}
                className="input w-full appearance-none bg-white pr-10"
                style={{ position: 'relative' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div className="relative" style={{ zIndex: 1 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
              <div className="relative">
                <select
                  value={cardForm.assignedTo}
                  onChange={(e) => setCardForm({ ...cardForm, assignedTo: e.target.value })}
                  className="input w-full appearance-none bg-white pr-10"
                  style={{ position: 'relative' }}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member._id || member} value={member._id || member}>
                      {member.name || member.email || 'User'}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              value={cardForm.dueDate}
              onChange={(e) => setCardForm({ ...cardForm, dueDate: e.target.value })}
              className="input"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingCard(null);
                setCardForm({
                  title: '',
                  description: '',
                  assignedTo: '',
                  dueDate: '',
                  priority: 'medium',
                  status: 'todo',
                });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Card
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Board;
