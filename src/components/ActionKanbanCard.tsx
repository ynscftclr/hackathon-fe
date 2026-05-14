import React from 'react';
import type { Action } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCardStore } from '@/store/useCardStore';

const ACTION_PREFIX = 'action:' as const;

export function actionSortableId(actionId: string) {
  return `${ACTION_PREFIX}${actionId}`;
}

interface Props {
  action: Action;
}

export const ActionKanbanCard: React.FC<Props> = ({ action }) => {
  const persons = useCardStore((s) => s.persons);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: actionSortableId(action.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.85 : 1,
  };

  const assignee = persons.find((p) => p.id === action.assigneeId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-3 cursor-grab rounded-xl border border-amber-200/80 bg-white p-3 shadow-sm active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-semibold leading-snug text-slate-900">{action.title}</p>
      {action.description ? (
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">{action.description}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-[10px] font-medium text-amber-900/80">
          {assignee ? `${assignee.name} ${assignee.surname}`.trim() : 'Atama yok'}
        </span>
      </div>
    </div>
  );
};
