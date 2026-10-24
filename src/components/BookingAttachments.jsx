import { useEffect, useState } from 'react';
import { CloseIcon } from './JourneyEvents';
import { readPhoto } from '../lib/notebook-store.js';

function Attachment({ bookId, attachment, pending, onRemove }) {
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    let live = true, url;
    Promise.resolve(pending ?? readPhoto(bookId, attachment.id)).then(blob => {
      if (!blob) throw new Error('附件无法读取，请从备份恢复。');
      if (live) { url = URL.createObjectURL(blob); setUrl(url); }
    }).catch(error => { if (live) setError(error.message); });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [bookId, attachment.id, pending]);
  return <li className="booking-attachment">{url ? <a href={url} target="_blank" rel="noopener noreferrer">{attachment.name}</a> : <span>{error || attachment.name}</span>}{onRemove && <button type="button" className="theme-toggle" aria-label={`移除附件 ${attachment.name}`} onClick={() => onRemove(attachment.id)}><CloseIcon /></button>}</li>;
}

export default function BookingAttachments({ bookId, attachments = [], pending, onRemove }) {
  if (!attachments.length) return null;
  return <ul className="booking-attachments">{attachments.map(attachment => <Attachment key={attachment.id} bookId={bookId} attachment={attachment} pending={pending?.get(attachment.id)} onRemove={onRemove} />)}</ul>;
}
