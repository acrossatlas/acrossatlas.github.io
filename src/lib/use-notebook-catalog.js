import { useEffect, useMemo, useState } from 'react';
import { journeys } from '../data/archive.js';
import { journeyFromNotebook, localJourneyBase } from './notebook.js';
import { listNotebooks } from './notebook-store.js';
import { subscribeNotebooks } from './use-notebook.js';

export function useNotebookCatalog() {
  const [records, setRecords] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const load = () => listNotebooks().then(records => { if (live) { setRecords(records); setLoading(false); } }).catch(error => { if (live) { setError(error.message); setLoading(false); } });
    load(); const unsubscribe = subscribeNotebooks(load);
    return () => { live = false; unsubscribe(); };
  }, []);
  const catalog = useMemo(() => {
    const active = records.filter(record => !record.deletedAt);
    const removed = new Set(records.filter(record => record.deletedAt).map(record => record.id));
    const byId = new Map(active.map(record => [record.id, record.document]));
    const result = journeys.filter(journey => !removed.has(journey.id)).map(journey => byId.has(journey.id) ? journeyFromNotebook(byId.get(journey.id), journey) : journey);
    for (const record of active) if (!journeys.some(journey => journey.id === record.id)) result.push(journeyFromNotebook(record.document, localJourneyBase(record.document)));
    return result.sort((a, b) => b.startsOn.localeCompare(a.startsOn));
  }, [records]);
  return { journeys: catalog, deletedIds: records.filter(record => record.deletedAt).map(record => record.id), loading, error };
}
