import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchItems, addItem, selectItems } from './api';
import { useInfiniteList } from './useInfiniteList';
import { useScrollSentinel } from './useScrollSentinel';

export default function LeftPanel({ onSelect }) {
  const fetchFn = useCallback((offset, limit, filter, lastId) => fetchItems({ offset, limit, filter, lastId }), []);
  const { items, total, loading, hasMore, filter, reset, loadMore } = useInfiniteList(fetchFn);

  const [filterInput, setFilterInput] = useState('');
  const [newId, setNewId] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const [addPending, setAddPending] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    reset('');
  }, [reset]);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setFilterInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => reset(val), 300);
  };

  const sentinelRef = useScrollSentinel(loadMore, hasMore && !loading, wrapperRef);

  const handleSelect = async (id) => {
    try {
      await selectItems([id]);
      onSelect();
      reset(filter);
    } catch {}
  };

  const handleAddItem = async () => {
    const parsed = parseInt(newId, 10);
    if (!Number.isFinite(parsed)) {
      setAddStatus('Enter a valid integer ID');
      return;
    }
    // setAddPending(true);
    setAddStatus('Queued — will be sent in the next batch (up to 10 s)…');
    try {
      await addItem(parsed, () => {
        setAddStatus(`Items added.`);
        setNewId('');
        reset(filter);
      });
    } catch (e) {
      console.log(e);
      setAddStatus('Request failed.');
    } finally {
      setAddPending(false);
    }
  };

  return (
    <div className="panel">
      <h2 className="panel-title">All Items ({total.toLocaleString()})</h2>

      <div className="panel-controls">
        <input className="filter-input" placeholder="Filter by ID…" value={filterInput} onChange={handleFilterChange} />
      </div>

      <div className="add-item-row">
        <input className="add-input" placeholder="New item ID…" value={newId} onChange={(e) => setNewId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddItem()} type="number" />
        <button className="btn btn-add" onClick={handleAddItem} disabled={addPending}>
          Add
        </button>
      </div>
      {addStatus && <div className="add-status">{addStatus}</div>}

      <div className="list-wrapper" ref={wrapperRef}>
        <ul className="item-list">
          {items.map(({ id, name }) => (
            <li key={id} className="item-row">
              <span className="item-id">#{id}</span>
              <span className="item-name">{name}</span>
              <button className="btn btn-select" onClick={() => handleSelect(id)}>
                &rarr;
              </button>
            </li>
          ))}
        </ul>
        <div ref={sentinelRef} className="sentinel" />
        {loading && <div className="loading">Loading…</div>}
        {!hasMore && !loading && items.length > 0 && <div className="end-msg">End of list</div>}
      </div>
    </div>
  );
}
