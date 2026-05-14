import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Action } from '@/types';
import { ActionKanbanCard, actionSortableId } from './ActionKanbanCard';

export function actionColumnDroppableId(status: Action['status']) {
  return `action-col-${status}`;
}

interface Props {
  title: string;
  status: Action['status'];
  actions: Action[];
}

export const ActionKanbanColumn: React.FC<Props> = ({ title, status, actions }) => {
  const { setNodeRef, isOver } = useDroppable({ id: actionColumnDroppableId(status) });
  const sortableIds = actions.map((a) => actionSortableId(a.id));

  return (
    <div
      className={`flex w-80 shrink-0 flex-col rounded-2xl border p-4 transition-colors ${
        isOver ? 'border-amber-400 bg-amber-50/40' : 'border-amber-200/70 bg-amber-50/25'
      }`}
    >
      <div className="mb-3 flex min-h-[2rem] items-center gap-2 px-1">
        <h3 className="min-w-0 flex-1 truncate font-semibold text-amber-950">{title}</h3>
        <span className="shrink-0 rounded-full bg-amber-100/90 px-2 py-0.5 text-xs font-medium text-amber-900">
          {actions.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="scrollbar-thin scrollbar-thumb-amber-200/80 min-h-[140px] flex-1 overflow-y-auto"
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {actions.map((a) => (
            <ActionKanbanCard key={a.id} action={a} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
