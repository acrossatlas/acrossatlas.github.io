import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { journalSummary } from '../lib/journal-storage';
import './journal-editor.css';

export default function JournalEntry({ journey }) {
  const summary = journalSummary(journey.id);
  return <div className="journal-entry">
    <div className="journal-entry__book" aria-hidden="true"><span /><span /></div>
    <div className="journal-entry__copy"><h3>{summary?.title || '把旅途，排成一本小刊物。'}</h3><p>{summary ? `${summary.pages} 页 · ${summary.photos} 个照片框` : 'TN 标准本 · 自由排版 · 原尺寸打印'}</p></div>
    <Link className="btn btn--secondary btn--lg journal-entry__action" to={`/trips/${journey.id}/journal`}>打开手帐画布<ArrowUpRight /></Link>
  </div>;
}
