import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CloseIcon, ReservationDetails } from './JourneyEvents';
import NotebookDialog, { EditorField, EditorFooter } from './NotebookDialog';
import TimeRangeField from './TimeRangeField';
import BookingAttachments from './BookingAttachments';
import { EVENT_TYPES, PAYMENT_STATES, RESERVATION_STATES, TRANSPORT_MODES, compactEventDetail, eventSchedule } from '../lib/notebook.js';
import { useDraftAutosave } from '../lib/use-draft-autosave.js';
import { prepareAttachment } from '../lib/booking-attachments.js';

function initialSegments(event, day, id) {
  const schedule = eventSchedule(event, day);
  let segments = structuredClone(event?.transport?.segments?.length ? event.transport.segments : (event?.flightLegs ?? []).map((leg, index) => ({ id: `${id}-leg-${index}`, mode: '航班', from: leg.from, to: leg.to, code: leg.code, depart: leg.depart, arrive: leg.arrive, departsOn: '', arrivesOn: '' })));
  if (!segments.length) segments = [{ id: `${id}-leg-0`, mode: event?.transport?.mode ?? '', from: event?.transport?.from ?? '', to: event?.transport?.to ?? '', code: event?.transport?.code ?? '', depart: schedule.startsAt, arrive: schedule.endsAt, departsOn: schedule.startsOn, arrivesOn: schedule.endsOn }];
  segments[0].departsOn ||= schedule.startsOn;
  segments.at(-1).arrivesOn ||= schedule.endsOn;
  return segments;
}

export default function ItineraryEditor({ selection, book, onSave, onDelete, onClose }) {
  const event = selection.event;
  const [draft, setDraft] = useState(() => ({
    fields: { title: event?.title ?? '', type: event?.type ?? '', timeNote: event?.timeNote ?? '', navigation: event?.navigation ?? '', detail: compactEventDetail(event ?? {}), bookingUrl: event?.bookingUrl ?? '',
      reservationStatus: event?.reservationStatus === '不适用' ? '' : event?.reservationStatus ?? '', paymentStatus: event?.paymentStatus === '不适用' ? '' : event?.paymentStatus ?? '',
      country: event ? event.country ?? '' : selection.country ?? '', attachments: structuredClone(event?.attachments ?? []),
    },
    schedule: eventSchedule(event, selection.dayId), segments: initialSegments(event, selection.dayId, selection.id),
  }));
  const [deleting, setDeleting] = useState(false), [working, setWorking] = useState(false), [localError, setLocalError] = useState('');
  const input = useRef(null), pending = useRef(new Map());
  const fields = draft.fields;
  const titleFor = draft => draft.fields.type === '交通' ? draft.segments[0].from.trim() && draft.segments.at(-1).to.trim() ? `${draft.segments[0].from.trim()} - ${draft.segments.at(-1).to.trim()}` : event?.type === '交通' ? event.title : '' : draft.fields.title.trim();
  const title = titleFor(draft);
  const field = key => ({ value: fields[key] ?? '', onChange: e => setDraft(draft => ({ ...draft, fields: { ...draft.fields, [key]: e.target.value } })) });
  const autosave = useDraftAutosave(draft, { revision: selection.revision, enabled: !deleting && !working,
    ready: draft => Boolean(draft.fields.type && titleFor(draft)), invalidMessage: fields.type === '交通' ? '请填写出发地和最终目的地。' : '请填写名称。',
    onSave: async (draft, revision) => {
      const fields = Object.fromEntries(Object.entries(draft.fields).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
      fields.title = titleFor(draft); fields.reservationStatus ||= null; fields.paymentStatus ||= null; fields.country ||= null;
      let schedule = draft.schedule;
      if (fields.type === '交通') {
        const first = draft.segments[0], last = draft.segments.at(-1);
        schedule = { startsOn: first.departsOn || selection.dayId, startsAt: first.depart || '', endsOn: last.arrivesOn || first.departsOn || selection.dayId, endsAt: last.arrive || '' };
        fields.transport = { mode: first.mode || '', from: first.from, to: last.to, code: draft.segments.length === 1 ? first.code : '', segments: draft.segments };
      }
      Object.assign(fields, schedule);
      const files = fields.attachments.filter(file => pending.current.has(file.id)).map(file => ({ id: file.id, blob: pending.current.get(file.id) }));
      const savedRevision = await onSave(schedule.startsOn, fields, revision, files);
      files.forEach(file => pending.current.delete(file.id)); return savedRevision;
    },
  });
  async function close() {
    const hasContent = fields.title.trim() || fields.detail.trim() || fields.attachments.length || draft.segments.some(segment => segment.from || segment.to || segment.code);
    if (!event && !hasContent && autosave.revision.current === selection.revision) { onClose(); return; }
    try { await autosave.flush(); onClose(); } catch { /* Keep the unsaved input available. */ }
  }
  async function remove() {
    setWorking(true); setLocalError('');
    try { await autosave.wait(); await onDelete(autosave.revision.current); onClose(); }
    catch (error) { setLocalError(error.message); } finally { setWorking(false); }
  }
  function attach(files) {
    setLocalError('');
    try {
      if (files.length + fields.attachments.length > 10) throw new Error('每项安排最多添加 10 个预订附件。');
      const prepared = files.map(prepareAttachment);
      prepared.forEach(file => pending.current.set(file.id, file.blob));
      setDraft(draft => ({ ...draft, fields: { ...draft.fields, attachments: [...draft.fields.attachments, ...prepared.map(({ blob, ...file }) => file)] } }));
    } catch (error) { setLocalError(error.message); }
    finally { if (input.current) input.current.value = ''; }
  }
  function changeSegment(id, fields) { setDraft(draft => ({ ...draft, segments: draft.segments.map(segment => segment.id === id ? { ...segment, ...fields } : segment) })); }
  const toolbar = <div className="ticket-printer-dialog__header notebook-event-toolbar">
    <div className="day-tabs notebook-type-tabs" role="tablist" aria-label="行程类型">{EVENT_TYPES.map(type => <button key={type} type="button" role="tab" disabled={deleting || working} aria-selected={fields.type === type} className={fields.type === type ? 'is-active' : ''} onClick={() => setDraft(draft => ({ ...draft, fields: { ...draft.fields, type } }))}>{type}</button>)}</div>
    <div className="day-event-card__signals notebook-event-states">
      <select className="reservation-info-trigger" aria-label="预订状态" disabled={deleting || working} {...field('reservationStatus')}>{RESERVATION_STATES.map(state => <option key={state} value={state}>{state || '预订'}</option>)}</select>
      <select className="reservation-info-trigger" aria-label="付款状态" disabled={deleting || working} {...field('paymentStatus')}>{PAYMENT_STATES.map(state => <option key={state} value={state}>{state || '付款'}</option>)}</select>
    </div>
    <button className="ticket-printer-dialog__close" type="button" aria-label="关闭编辑窗口" disabled={working} onClick={close}><CloseIcon /></button>
  </div>;
  return <NotebookDialog className="notebook-editor--compact" title={deleting ? '删除行程' : '编辑行程'} header={toolbar} onClose={close} busy={working}>
    <form className="notebook-editor__form" onSubmit={e => { e.preventDefault(); close(); }}><div className="journey-modal__body">
      {deleting ? <div className="reservation-state"><strong>{title || '这项行程'}</strong><p>删除后可以撤销恢复。</p></div> : <>
        {fields.type && <fieldset className="notebook-fields" disabled={working}>
          {fields.type === '交通' ? <div className="notebook-segments">
            {draft.segments.map((segment, index) => <section className={draft.segments.length > 1 ? 'info-card notebook-segment' : 'notebook-single-leg'} key={segment.id} aria-label={`第 ${index + 1} 段行程`}>
              <div className="notebook-segment-tools">{draft.segments.length > 1 && <h4>第 {index + 1} 段</h4>}<select className="reservation-info-trigger notebook-status-select" aria-label={draft.segments.length > 1 ? `第${index + 1}段交通方式` : '交通方式'} value={segment.mode} onChange={e => changeSegment(segment.id, { mode: e.target.value })}><option value="">交通方式</option>{TRANSPORT_MODES.map(mode => <option key={mode}>{mode}</option>)}</select>{draft.segments.length > 1 && <button type="button" className="theme-toggle" aria-label={`删除第 ${index + 1} 段`} onClick={() => setDraft(draft => ({ ...draft, segments: draft.segments.filter(item => item.id !== segment.id) }))}><Trash2 size={13} /></button>}</div>
              <EditorField label="出发地"><input autoFocus={!event && index === 0} value={segment.from} onChange={e => changeSegment(segment.id, { from: e.target.value })} /></EditorField>
              <EditorField label="目的地"><input value={segment.to} onChange={e => changeSegment(segment.id, { to: e.target.value })} /></EditorField>
              <TimeRangeField prefix={draft.segments.length > 1 ? `第${index + 1}段` : ''} startsAt={segment.depart} endsAt={segment.arrive} onChange={value => changeSegment(segment.id, { depart: value.startsAt, arrive: value.endsAt })} />
              <EditorField label="班次"><input value={segment.code ?? ''} onChange={e => changeSegment(segment.id, { code: e.target.value })} /></EditorField>
            </section>)}
            <button type="button" className="notebook-text-action notebook-add-segment" aria-label="添加一段行程" onClick={() => setDraft(draft => ({ ...draft, segments: [...draft.segments, { id: crypto.randomUUID(), mode: draft.segments.at(-1).mode, from: draft.segments.at(-1).to, to: '', code: '', depart: '', arrive: '', departsOn: draft.segments.at(-1).arrivesOn || draft.schedule.startsOn, arrivesOn: draft.segments.at(-1).arrivesOn || draft.schedule.startsOn }] }))}><Plus size={14} />添加一段</button>
          </div> : <>
            <EditorField label="名称"><input autoFocus required maxLength={500} {...field('title')} /></EditorField>
            <TimeRangeField startsAt={draft.schedule.startsAt} endsAt={draft.schedule.endsAt} onChange={time => setDraft(draft => ({ ...draft, schedule: { ...draft.schedule, ...time } }))} />
            <EditorField label="地址"><input maxLength={2000} {...field('navigation')} /></EditorField>
          </>}
          <EditorField label="说明"><textarea rows={3} maxLength={10000} {...field('detail')} /></EditorField>
          <ReservationDetails event={event ?? {}}>
            <header className="info-card__meta"><span>预订信息</span><button className="reservation-info-trigger" type="button" onClick={() => input.current.click()}>上传凭证</button></header>
            <dl className="info-card__details"><div><dt>链接</dt><dd><input className="notebook-reservation-link" type="url" aria-label="预订链接" placeholder="https://…" maxLength={2000} {...field('bookingUrl')} /></dd></div></dl>
            <BookingAttachments bookId={book.id} attachments={fields.attachments} pending={pending.current} onRemove={id => setDraft(draft => ({ ...draft, fields: { ...draft.fields, attachments: draft.fields.attachments.filter(file => file.id !== id) } }))} />
            <input ref={input} type="file" multiple className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" aria-label="上传预订凭证" onChange={e => attach([...e.target.files])} />
          </ReservationDetails>
        </fieldset>}
      </>}
      {(autosave.error || localError) && <p className="notebook-editor__error" role="alert">{localError || autosave.error}</p>}
    </div><EditorFooter>
      {deleting ? <><button className="journey-tool-button" type="button" disabled={working} onClick={() => setDeleting(false)}>保留</button><button className="journey-tool-button is-primary" type="button" disabled={working} onClick={remove}>确认删除</button></> : <>{autosave.error && <button className="journey-tool-button" type="button" onClick={onClose}>放弃修改</button>}{(event || autosave.revision.current !== selection.revision) && <button className="journey-tool-button" type="button" onClick={async () => { await autosave.wait().catch(() => {}); setDeleting(true); }}>删除</button>}<button className="journey-tool-button is-primary" type="submit" disabled={working}>完成</button></>}
    </EditorFooter></form>
  </NotebookDialog>;
}
