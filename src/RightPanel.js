import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchSelected, deselectItem, reorderSelected } from './api';
import { useInfiniteList } from './useInfiniteList';
import { useScrollSentinel } from './useScrollSentinel';

export default function RightPanel({ refreshToken, onDeselect }) {
  const fetchFn = useCallback((offset, limit, filter) => fetchSelected({ offset, limit, filter }), []);
  const { items, setItems, total, loading, hasMore, filter, reset, loadMore } = useInfiniteList(fetchFn);

  const [filterInput, setFilterInput] = useState('');
  const debounceRef = useRef(null);
  const prevRefreshToken = useRef(refreshToken);
  const wrapperRef = useRef(null);

  useEffect(() => {
    reset('');
  }, [reset]);

  useEffect(() => {
    if (refreshToken !== prevRefreshToken.current) {
      prevRefreshToken.current = refreshToken;
      reset(filter);
    }
  }, [refreshToken, filter, reset]);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setFilterInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => reset(val), 300);
  };

  const sentinelRef = useScrollSentinel(loadMore, hasMore && !loading, wrapperRef);

  const handleDeselect = async (id) => {
    try {
      await deselectItem(id);
      onDeselect();
      reset(filter);
    } catch {}
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    const reordered = Array.from(items);
    const [movedItem] = reordered.splice(from, 1);
    reordered.splice(to, 0, movedItem);
    setItems(reordered);

    try {
      const all = await fetchSelected({ offset: 0, limit: 1_000_000, filter: '' });
      const allItems = all.items || [];
      const allIds = allItems.map((item) => item.id);
      const movedId = movedItem.id;
      const fullReordered = allIds.filter((id) => id !== movedId);
      if (to === 0) {
        fullReordered.splice(0, 0, movedId);
      } else {
        const beforeId = reordered[to - 1].id;
        const insertAfter = fullReordered.indexOf(beforeId);
        fullReordered.splice(insertAfter + 1, 0, movedId);
      }
      await reorderSelected(fullReordered);
    } catch {}
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Selected ({total.toLocaleString()})</h2>

      <div className="panel-controls">
        <input className="filter-input" placeholder="Filter by ID…" value={filterInput} onChange={handleFilterChange} />
      </div>

      <div className="list-wrapper" ref={wrapperRef}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="selected-list">
            {(provided) => (
              <ul className="item-list" ref={provided.innerRef} {...provided.droppableProps}>
                {items.map(({ id, name }, index) => (
                  <Draggable key={String(id)} draggableId={String(id)} index={index}>
                    {(provided, snapshot) => (
                      <li className={`item-row${snapshot.isDragging ? ' dragging' : ''}`} ref={provided.innerRef} {...provided.draggableProps}>
                        <span className="drag-handle" {...provided.dragHandleProps} title="Drag to reorder">
                          ⠿
                        </span>
                        <span className="item-id">#{id}</span>
                        <span className="item-name">{name}</span>
                        <button className="btn btn-deselect" onClick={() => handleDeselect(id)}>
                          &larr;
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        <div ref={sentinelRef} className="sentinel" />
        {loading && <div className="loading">Loading…</div>}
        {!hasMore && !loading && items.length > 0 && <div className="end-msg">End of list</div>}
        {!loading && items.length === 0 && <div className="empty-msg">No selected items</div>}
      </div>
    </div>
  );
}
