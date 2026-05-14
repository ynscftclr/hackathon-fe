import React, { useState } from 'react';
import { DndContext, DragEndEvent, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCardStore } from '@/store/useCardStore';
import { Column } from './Column';
import { Plus, Loader2 } from 'lucide-react';

export const Board: React.FC = () => {
  const { cards, groups, updateCardGroup, addGroup, currentUser, retroBoardId, retroRevealed } = useCardStore();
  const isLead = currentUser?.role === 'lead';
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    const isOverGroup = groups.some(g => g.id === overId) || overId === 'ungrouped';
    
    let targetGroupId: string | null = null;
    
    if (isOverGroup) {
      targetGroupId = overId === 'ungrouped' ? null : overId;
    } else {
      const overCard = cards.find(c => c.id === overId);
      if (overCard) {
        targetGroupId = overCard.groupId;
      }
    }

    const currentCard = cards.find(c => c.id === cardId);
    if (currentCard && currentCard.groupId !== targetGroupId) {
      updateCardGroup(cardId, targetGroupId);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    setIsAddingGroup(true);
    await addGroup(newGroupTitle.trim());
    setNewGroupTitle('');
    setIsAddingGroup(false);
  };

  if (groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <p className="text-center text-lg font-semibold tracking-tight text-slate-600">
          Henüz retro başlatılmadı
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-8 items-start h-[calc(100vh-160px)] scrollbar-thin scrollbar-thumb-slate-300">
        {groups.map(group => (
          <Column key={group.id} group={group} cards={cards.filter(c => c.groupId === group.id)} />
        ))}
        <Column 
          group={{ id: 'ungrouped', title: 'Gruplanmamış' }} 
          cards={cards.filter(c => c.groupId === null)} 
        />
        
        {isLead && !retroBoardId && (
          <div className="bg-slate-200/40 border border-slate-300 border-dashed rounded-2xl p-4 flex flex-col w-80 shrink-0">
            <form onSubmit={handleAddGroup} className="flex flex-col gap-3">
              <h3 className="font-semibold text-slate-600 mb-1">Yeni Başlık Ekle</h3>
              <input
                type="text"
                placeholder="Örn: Action Items..."
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                disabled={isAddingGroup}
              />
              <button
                type="submit"
                disabled={!newGroupTitle.trim() || isAddingGroup}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-300 disabled:opacity-50"
              >
                {isAddingGroup ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Oluştur
              </button>
            </form>
          </div>
        )}
      </div>
    </DndContext>
  );
};
