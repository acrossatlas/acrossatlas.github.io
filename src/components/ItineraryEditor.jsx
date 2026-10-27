import { useRef, useState } from 'react';
import { Paperclip, Plus, Trash2 } from 'lucide-react';
import NotebookDialog from './NotebookDialog';
import { Button, Field, FieldRow, FormError, FormFooter, FormHint, FormSection, Segmented, TagSelect, TimeRange } from './form/Form';
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
  // True when everything is saved (or there is nothing worth keeping); false means closing would lose input.
  async function canClose() {
    const hasContent = fields.title.trim() || fields.detail.trim() || fields.bookingUrl.trim() || fields.attachments.length || draft.segments.some(segment => segment.from || segment.to || segment.code);
    if (!event && !hasContent && autosave.revision.current === selection.revision) return true;
    try { await autosave.flush(); return true; } catch { return false; }
  }
  async function done() { if (await canClose()) onClose(); }
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
  const removeSegment = id => setDraft(draft => ({ ...draft, segments: draft.segments.filter(item => item.id !== id) }));
  const addSegment = () => setDraft(draft => {
    const last = draft.segments.at(-1), on = last.arrivesOn || draft.schedule.startsOn;
    return { ...draft, segments: [...draft.segments, { id: crypto.randomUUID(), mode: last.mode, from: last.to, to: '', code: '', depart: '', arrive: '', departsOn: on, arrivesOn: on }] };
  });
  const multiLeg = draft.segments.length > 1, isNew = !event;
  const header = <Segmented label="行程类型" options={EVENT_TYPES} value={fields.type} disabled={deleting || working} onChange={type => setDraft(draft => ({ ...draft, fields: { ...draft.fields, type } }))} />;
  const leg = (segment, index) => {
    const prefix = multiLeg ? `第${index + 1}段` : '';
    return <>
      <FieldRow>
        <Field label="出发地"><input data-autofocus={isNew && index === 0 ? '' : undefined} value={segment.from} onChange={e => changeSegment(segment.id, { from: e.target.value })} /></Field>
        <Field label="目的地"><input value={segment.to} onChange={e => changeSegment(segment.id, { to: e.target.value })} /></Field>
      </FieldRow>
      <TimeRange prefix={prefix} startsAt={segment.depart} endsAt={segment.arrive} onChange={value => changeSegment(segment.id, { depart: value.startsAt, arrive: value.endsAt })} />
      <FieldRow>
        <Field label="交通方式"><select value={segment.mode} onChange={e => changeSegment(segment.id, { mode: e.target.value })}><option value="">未选择</option>{TRANSPORT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}</select></Field>
        <Field label="班次"><input placeholder="航班号、车次等" value={segment.code ?? ''} onChange={e => changeSegment(segment.id, { code: e.target.value })} /></Field>
      </FieldRow>
    </>;
  };
  return <NotebookDialog className="notebook-editor--compact" title={deleting ? '删除行程' : '编辑行程'} header={header} onClose={onClose} canClose={canClose} busy={working}>
    <form className="notebook-editor__form" onSubmit={e => { e.preventDefault(); done(); }}><div className="journey-modal__body">
      {deleting ? <div className="reservation-state"><strong>{title || '这项行程'}</strong><p>删除后可以撤销恢复。</p></div> : <>
        {!fields.type && <FormHint>先选择一个类型。</FormHint>}
        {fields.type && <fieldset className="form-fields" disabled={working}>
          {fields.type === '交通' ? <div className="notebook-segments">
            {multiLeg
              ? draft.segments.map((segment, index) => <FormSection key={segment.id} aria-label={`第 ${index + 1} 段行程`} title={`第 ${index + 1} 段`}
                  actions={<button type="button" className="form-icon-button" aria-label={`删除第 ${index + 1} 段`} onClick={() => removeSegment(segment.id)}><Trash2 /></button>}>{leg(segment, index)}</FormSection>)
              : <section className="form-fields" aria-label="第 1 段行程">{leg(draft.segments[0], 0)}</section>}
            <Button variant="text" className="notebook-add-segment" aria-label="添加一段行程" onClick={addSegment}><Plus />添加一段</Button>
          </div> : <>
            <Field label="名称"><input data-autofocus={isNew ? '' : undefined} required maxLength={500} {...field('title')} /></Field>
            <TimeRange startsAt={draft.schedule.startsAt} endsAt={draft.schedule.endsAt} onChange={time => setDraft(draft => ({ ...draft, schedule: { ...draft.schedule, ...time } }))} />
            <Field label="地址"><input maxLength={2000} placeholder="用于导航和地图定位" {...field('navigation')} /></Field>
          </>}
          <Field label="说明"><textarea rows={3} maxLength={10000} {...field('detail')} /></Field>
          <FormSection title="预订信息" className="notebook-booking" actions={<div className="form-section__tools">
            <TagSelect aria-label="预订状态" placeholder="预订" options={RESERVATION_STATES} {...field('reservationStatus')} />
            <TagSelect aria-label="付款状态" placeholder="付款" options={PAYMENT_STATES} {...field('paymentStatus')} />
          </div>}>
            <Field label="链接"><input type="url" aria-label="预订链接" placeholder="https://…" maxLength={2000} {...field('bookingUrl')} /></Field>
            <BookingAttachments bookId={book.id} attachments={fields.attachments} pending={pending.current} onRemove={id => setDraft(draft => ({ ...draft, fields: { ...draft.fields, attachments: draft.fields.attachments.filter(file => file.id !== id) } }))} />
            <Button variant="text" className="notebook-booking__upload" onClick={() => input.current.click()}><Paperclip />上传凭证</Button>
            <input ref={input} type="file" multiple className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" aria-label="上传预订凭证" onChange={e => attach([...e.target.files])} />
          </FormSection>
        </fieldset>}
      </>}
      <FormError>{localError || autosave.error}</FormError>
    </div>
    {deleting
      ? <FormFooter><Button disabled={working} onClick={() => setDeleting(false)}>保留</Button><Button variant="primary" disabled={working} onClick={remove}>确认删除</Button></FormFooter>
      : <FormFooter danger={(event || autosave.revision.current !== selection.revision) && <Button variant="danger" onClick={async () => { await autosave.wait().catch(() => {}); setDeleting(true); }}><Trash2 />删除</Button>}>
        <Button variant="primary" type="submit" disabled={working}>完成</Button>
      </FormFooter>}
    </form>
  </NotebookDialog>;
}
