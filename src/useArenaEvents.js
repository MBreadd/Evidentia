import { useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

export function useArenaEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching arena events from Supabase...');
      const { data, error: err } = await supabase
        .from('arena_events')
        .select('*')
        .order('start_date', { ascending: true });

      console.log('Arena events fetched:', data);
      console.log('Error:', err);

      if (err) throw err;

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching arena events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { events, loading, error, fetchEvents };
}
