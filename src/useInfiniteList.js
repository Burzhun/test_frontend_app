import { useState, useCallback, useRef } from 'react';

const PAGE_SIZE = 20;

export function useInfiniteList(fetchFn) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [lastId, setLastId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('');
  const offsetRef = useRef(0);
  const filterRef = useRef('');
  const loadingRef = useRef(false);

  const reset = useCallback(
    async (newFilter = filterRef.current) => {
      filterRef.current = newFilter;
      offsetRef.current = 0;
      setFilter(newFilter);
      setItems([]);
      setTotal(0);
      setLastId(0);
      setHasMore(true);
      loadingRef.current = true;
      setLoading(true);
      try {
        const data = await fetchFn(0, PAGE_SIZE, newFilter);
        if (!data) {
          setLoading(false);
          return;
        }
        const fetched = data.items || [];
        const tot = data.total || 0;
        setItems(fetched);
        setTotal(tot);
        if (fetched.length) setLastId(fetched[fetched.length - 1].id);
        offsetRef.current = fetched.length;
        setHasMore(fetched.length < tot);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [fetchFn],
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchFn(offsetRef.current, PAGE_SIZE, filterRef.current, lastId);
      if (!data) {
        setLoading(false);
        return;
      }
      const newItems = data.items || [];
      const tot = data.total || 0;
      setItems((prev) => [...prev, ...newItems]);
      setTotal(tot);
      setLastId(newItems[newItems.length - 1].id);
      offsetRef.current += newItems.length;
      setHasMore(offsetRef.current < tot);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchFn, lastId]);

  return { items, setItems, total, loading, hasMore, filter, reset, loadMore };
}
