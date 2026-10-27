import { useRef, useState } from 'react';
import { MapPin, Paperclip, Plus, Ticket, Trash2 } from 'lucide-react';
import NotebookDialog from './NotebookDialog';
import { AddBar, Button, ConfirmButton, Field, FieldGroup, FormError, FormFooter, FormSection, Segmented, Split, SplitSelect, TagSelect, TimeRange } from './form/Form';
import BookingAttachments from './BookingAttachments';
import { EVENT_TYPES, PAYMENT_STATES, RESERVATION_STATES, TRANSPORT_MODES, compactEventDetail, eventSchedule } from '../lib/notebook.js';
import { useUnsavedGuard } from '../lib/use-unsaved-guard.js';
import { prepareAttachment } from '../lib/booking-attachments.js';

function initialSegments(event, day, id) {
  const schedule = eventSchedule(event, day);
  let segments = structuredClone(event?.transport?.segments?.length ? event.transport.segments : (event?.flightLegs ?? []).map((leg, index) => ({ id: `${id}-leg-${index}`, mode: '航班', from: leg.from, to: leg.to, code: leg.code, depart: leg.depart, arrive: leg.arrive, departsOn: '', arrivesOn: '' })));
  if (!segments.length) segments = [{ id: `${id}-leg-0`, mode: event?.transport?.mode ?? '', from: event?.transport?.from ?? '', to: event?.transport?.to ?? '', code: event?.transport?.code ?? '', depart: schedule.startsAt, arrive: schedule.endsAt, departsOn: schedule.startsOn, arrivesOn: schedule.endsOn }];
  segments[0].departsOn ||= schedule.startsOn;
  segments.at(-1).arrivesOn ||= schedule.endsOn;
  return segments;
}

// Edits apply only on 完成. Closing with changes asks to discard them (see NotebookDialog).
export default function ItineraryEditor({ selection, book, onSave, onDelete, onClose }) {
  const event = selection.event;
  const [draft, setDraft] = useState(() => ({
    fields: { title: event?.title ?? '', type: event?.type ?? '行程', timeNote: event?.timeNote ?? '', navigation: event?.navigation ?? '', detail: compactEventDetail(event ?? {}), bookingUrl: event?.bookingUrl ?? '',
      reservationStatus: event?.reservationStatus === '不适用' ? '' : event?.reservationStatus ?? '', paymentStatus: event?.paymentStatus === '不适用' ? '' : event?.paymentStatus ?? '',
      country: event ? event.country ?? '' : selection.country ?? '', attachments: structuredClone(event?.attachments ?? []),
    },
    schedule: eventSchedule(event, selection.dayId), segments: initialSegments(event, selection.dayId, selection.id),
  }));
  const [working, setWorking] = useState(false), [error, setError] = useState(''), [checked, setChecked] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(() => Boolean(event?.bookingUrl || event?.attachments?.length));
  const input = useRef(null), pending = useRef(new Map());
  const dirty = useUnsavedGuard(draft);
  const fields = draft.fields, isTransport = fields.type === '交通', isNew = !event;
  const titleFor = draft => draft.fields.type === '交通' ? draft.segments[0].from.trim() && draft.segments.at(-1).to.trim() ? `${draft.segments[0].from.trim()} - ${draft.segments.at(-1).to.trim()}` : event?.type === '交通' ? event.title : '' : draft.fields.title.trim();
  const field = key => ({ value: fields[key] ?? '', onChange: e => setDraft(draft => ({ ...draft, fields: { ...draft.fields, [key]: e.target.value } })) });

  // Required: a name, or for transport the first departure and final destination.
  function validate(draft) {
    const errors = {};
    if (titleFor(draft)) return errors;
    if (draft.fields.type !== '交通') errors.title = '请填写名称';
    else draft.segments.forEach((segment, index) => {
      const missing = [index === 0 && !segment.from.trim() && '出发地', index === draft.segments.length - 1 && !segment.to.trim() && '目的地'].filter(Boolean);
      if (missing.length) errors[segment.id] = `请填写${missing.join('和')}`;
    });
    return errors;
  }
  const errors = checked ? validate(draft) : {};

  async function save() {
    if (!dirty && !isNew) { onClose(); return; }
    setChecked(true);
    const found = validate(draft);
    if (Object.keys(found).length) { requestAnimationFrame(() => document.querySelector('.notebook-editor [aria-invalid="true"]')?.focus()); return; }
    setWorking(true); setError('');
    try {
      const values = Object.fromEntries(Object.entries(draft.fields).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
      values.title = titleFor(draft); values.reservationStatus ||= null; values.paymentStatus ||= null; values.country ||= null;
      let schedule = draft.schedule;
      if (values.type === '交通') {
        const first = draft.segments[0], last = draft.segments.at(-1);
        schedule = { startsOn: first.departsOn || selection.dayId, startsAt: first.depart || '', endsOn: last.arrivesOn || first.departsOn || selection.dayId, endsAt: last.arrive || '' };
        values.transport = { mode: first.mode || '', from: first.from, to: last.to, code: draft.segments.length === 1 ? first.code : '', segments: draft.segments };
      }
      Object.assign(values, schedule);
      const files = values.attachments.filter(file => pending.current.has(file.id)).map(file => ({ id: file.id, blob: pending.current.get(file.id) }));
      await onSave(schedule.startsOn, values, selection.revision, files);
      onClose();
    } catch (error) { setError(error.message); setWorking(false); }
  }
  async function remove() {
    setWorking(true); setError('');
    try { await onDelete(selection.revision); onClose(); }
    catch (error) { setError(error.message); setWorking(false); }
  }
  function attach(files) {
    setError('');
    try {
      if (files.length + fields.attachments.length > 10) throw new Error('每项安排最多添加 10 个预订附件。');
      const prepared = files.map(prepareAttachment);
      prepared.forEach(file => pending.current.set(file.id, file.blob));
      setDraft(draft => ({ ...draft, fields: { ...draft.fields, attachments: [...draft.fields.attachments, ...prepared.map(({ blob, ...file }) => file)] } }));
    } catch (error) { setError(error.message); }
    finally { if (input.current) input.current.value = ''; }
  }
  function changeSegment(id, values) { setDraft(draft => ({ ...draft, segments: draft.segments.map(segment => segment.id === id ? { ...segment, ...values } : segment) })); }
  const removeSegment = id => setDraft(draft => ({ ...draft, segments: draft.segments.filter(item => item.id !== id) }));
  const addSegment = () => setDraft(draft => {
    const last = draft.segments.at(-1), on = last.arrivesOn || draft.schedule.startsOn;
    return { ...draft, segments: [...draft.segments, { id: crypto.randomUUID(), mode: last.mode, from: last.to, to: '', code: '', depart: '', arrive: '', departsOn: on, arrivesOn: on }] };
  });
  const multiLeg = draft.segments.length > 1;

  const leg = (segment, index) => {
    const prefix = multiLeg ? `第${index + 1}段` : '';
    return <>
      <FieldGroup label="路线" error={errors[segment.id]}><Split icon={MapPin} separator="→"
        left={<input aria-label="出发地" placeholder="出发地" data-autofocus={isNew && index === 0 ? '' : undefined} aria-invalid={errors[segment.id] && index === 0 && !segment.from.trim() ? true : undefined} value={segment.from} onChange={e => changeSegment(segment.id, { from: e.target.value })} />}
        right={<input aria-label="目的地" placeholder="目的地" aria-invalid={errors[segment.id] && index === draft.segments.length - 1 && !segment.to.trim() ? true : undefined} value={segment.to} onChange={e => changeSegment(segment.id, { to: e.target.value })} />} /></FieldGroup>
      <TimeRange prefix={prefix} startsAt={segment.depart} endsAt={segment.arrive} onChange={value => changeSegment(segment.id, { depart: value.startsAt, arrive: value.endsAt })} />
      <FieldGroup label="班次"><Split icon={Ticket} separator="·"
        left={<SplitSelect aria-label="交通方式" placeholder="交通方式" options={TRANSPORT_MODES} value={segment.mode} onChange={e => changeSegment(segment.id, { mode: e.target.value })} />}
        right={<input aria-label="班次" placeholder="航班号、车次" value={segment.code ?? ''} onChange={e => changeSegment(segment.id, { code: e.target.value })} />} /></FieldGroup>
    </>;
  };

  const states = <>
    <TagSelect aria-label="预订状态" placeholder="预订" options={RESERVATION_STATES} disabled={working} {...field('reservationStatus')} />
    <TagSelect aria-label="付款状态" placeholder="付款" options={PAYMENT_STATES} disabled={working} {...field('paymentStatus')} />
  </>;
  return <NotebookDialog className="notebook-editor--compact" title={isNew ? '添加行程' : '编辑行程'} dirty={dirty && !working} busy={working} onClose={onClose}
    header={<Segmented label="行程类型" options={EVENT_TYPES} value={fields.type} disabled={working} onChange={type => setDraft(draft => ({ ...draft, fields: { ...draft.fields, type } }))} />}
    actions={states}>
    <form className="notebook-editor__form" noValidate onSubmit={e => { e.preventDefault(); save(); }}><div className="journey-modal__body">
      <fieldset className="form-fields" disabled={working}>
        {isTransport ? <div className="notebook-segments">
          {multiLeg
            ? draft.segments.map((segment, index) => <FormSection key={segment.id} aria-label={`第 ${index + 1} 段行程`} title={`第 ${index + 1} 段`}
                actions={<button type="button" className="form-icon-button" aria-label={`删除第 ${index + 1} 段`} onClick={() => removeSegment(segment.id)}><Trash2 /></button>}>{leg(segment, index)}</FormSection>)
            : <section className="form-fields" aria-label="第 1 段行程">{leg(draft.segments[0], 0)}</section>}
          <Button variant="text" className="notebook-add-segment" aria-label="添加一段行程" onClick={addSegment}><Plus />添加一段</Button>
        </div> : <>
          <Field label="名称" error={errors.title}><input data-autofocus={isNew ? '' : undefined} maxLength={500} {...field('title')} /></Field>
          <TimeRange startsAt={draft.schedule.startsAt} endsAt={draft.schedule.endsAt} onChange={time => setDraft(draft => ({ ...draft, schedule: { ...draft.schedule, ...time } }))} />
          <Field label="地址"><input maxLength={2000} placeholder="用于导航和地图定位" {...field('navigation')} /></Field>
        </>}
        <Field label="说明"><textarea rows={3} maxLength={10000} {...field('detail')} /></Field>
        {bookingOpen
          ? <FormSection title="预订信息" className="notebook-booking">
              <Field label="链接"><input type="url" aria-label="预订链接" placeholder="https://…" maxLength={2000} {...field('bookingUrl')} /></Field>
              <FieldGroup label="凭证"><div className="notebook-booking__files">
                <BookingAttachments bookId={book.id} attachments={fields.attachments} pending={pending.current} onRemove={id => setDraft(draft => ({ ...draft, fields: { ...draft.fields, attachments: draft.fields.attachments.filter(file => file.id !== id) } }))} />
                <Button variant="text" onClick={() => input.current.click()}><Paperclip />上传凭证</Button>
              </div></FieldGroup>
              <input ref={input} type="file" multiple className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" aria-label="上传预订凭证" onChange={e => attach([...e.target.files])} />
            </FormSection>
          : <AddBar onClick={() => { setBookingOpen(true); requestAnimationFrame(() => document.querySelector('.notebook-booking input')?.focus()); }}><Plus />添加预订信息</AddBar>}
      </fieldset>
      <FormError>{error}</FormError>
    </div>
    <FormFooter>
      {!isNew && <ConfirmButton confirmLabel="确认删除" disabled={working} onConfirm={remove}>删除</ConfirmButton>}
      <Button variant="primary" type="submit" disabled={working}>{working ? '正在保存' : '完成'}</Button>
    </FormFooter>
    </form>
  </NotebookDialog>;
}
