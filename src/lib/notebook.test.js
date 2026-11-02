import test from 'node:test';
import assert from 'node:assert/strict';
import { journeys } from '../data/archive.js';
import { deleteEvent, eventSchedule, eventTimeLabel, hasChangedRoute, journeyFromNotebook, moveEvent, notebookFromJourney, reorderEvent, safeLink, saveEvent, validateNotebook } from './notebook.js';
import { applyEditablePacket, editablePacket, summarizeEditableChanges } from './notebook-exchange.js';
import { readBackup } from './notebook-backup.js';

const seed = () => notebookFromJourney(journeys[0]);

test('migration preserves all archived events, countries and imprecise time labels', () => {
  const book = seed();
  assert.equal(book.id, journeys[0].id);
  assert.equal(book.days.flatMap(day => day.events).length, Object.values(journeys[0].dayEvents).flat().length);
  assert.equal(book.days.flatMap(day => day.events).find(event => event.id === 'sep25-night-bus').timeNote, '夜间');
  assert.equal(book.days.flatMap(day => day.events).find(event => event.id === 'sep25-night-bus').startsAt, '');
  const original = journeys[0].dayEvents['2026-09-25'];
  assert.equal(original.find(event => event.id === 'sep25-night-bus').startsAt, '夜间');
  assert.deepEqual(book.days[1].events.map(event => event.country), original.map(event => event.country));
});

test('a cross-day move keeps one stable event ID and preserves reservation and route fields', () => {
  const book = seed(), original = book.days[1].events[0];
  const next = saveEvent(book, book.days[2].id, { title: '更改后的名称', startsAt: '10:30' }, original.id);
  assert.equal(next.days[1].events.some(event => event.id === original.id), false);
  const moved = next.days[2].events.find(event => event.id === original.id);
  assert.equal(moved.title, '更改后的名称');
  assert.deepEqual(moved.reservation, original.reservation);
  assert.equal(moved.country, original.country);
  assert.equal(next.days.flatMap(day => day.events).filter(event => event.id === original.id).length, 1);
  assert.equal(book.days[1].events[0].title, original.title);
});

test('editing a flight updates its linked Transport record without losing flight legs', () => {
  const book = seed(), event = book.days.flatMap(day => day.events).find(event => event.transportRecordId);
  const day = book.days.find(day => day.events.some(item => item.id === event.id));
  const legs = structuredClone(event.flightLegs); legs[0].depart = '16:20';
  const next = saveEvent(book, day.id, { title: '修改后的航班', flightLegs: legs }, event.id);
  const record = next.transport.find(record => record.id === event.transportRecordId);
  assert.equal(record.title, '修改后的航班');
  assert.equal(record.legs[0].depart, '16:20');
  assert.equal(journeyFromNotebook(next, journeys[0]).transportRecords.find(record => record.id === event.transportRecordId).legs[0].depart, '16:20');
});

test('explicit time edits clear legacy display overrides', () => {
  const book = seed(), event = book.days[1].events[0];
  event.displayEndsAt = '旧时间';
  const next = saveEvent(book, book.days[1].id, { endsAt: '12:34' }, event.id);
  assert.equal(next.days[1].events[0].endsAt, '12:34');
  assert.equal(next.days[1].events[0].displayEndsAt, undefined);
});

test('only route-affecting changes invalidate saved geometry', () => {
  const book = seed(), events = book.days[1].events;
  const times = structuredClone(events); times[0].startsAt = '12:00'; times[0].detail = '新说明';
  assert.equal(hasChangedRoute(times, events), false);
  const address = structuredClone(events); address[0].navigation = '另一个地址';
  assert.equal(hasChangedRoute(address, events), true);
  assert.equal(hasChangedRoute([...events].reverse(), events), true);
  assert.equal(hasChangedRoute(events.slice(1), events), true);
});

test('deleting and moving events never mutate the source notebook', () => {
  const book = seed(), day = book.days[1], first = day.events[0].id;
  const moved = moveEvent(book, day.id, first, 1);
  assert.equal(moved.days[1].events[1].id, first);
  assert.equal(book.days[1].events[0].id, first);
  assert.equal(deleteEvent(book, first).days.flatMap(day => day.events).some(event => event.id === first), false);
  assert.equal(book.days[1].events[0].id, first);
});

test('invalid dates, duplicate IDs, blank titles and unsafe links are rejected', () => {
  for (const alter of [
    book => { book.days[0].date = '2026-02-30'; },
    book => { book.days[1].events[0].id = book.days[0].events[0].id; },
    book => { book.days[0].events[0].title = ' '; },
    book => { book.days[0].events[0].bookingUrl = 'javascript:alert(1)'; },
    book => { book.days[0].events[0].startsAt = '25:60'; },
  ]) { const book = seed(); alter(book); assert.throws(() => validateNotebook(book)); }
  assert.equal(safeLink('javascript:alert(1)'), '');
  assert.equal(safeLink('https://example.com/booking'), 'https://example.com/booking');
});

test('native schedule fields preserve actual overnight arrivals rather than the old 23:59 sentinel', () => {
  const book = seed(), event = book.days[0].events[0];
  const range = eventSchedule(event, book.days[0].date);
  assert.equal(range.endsOn, '2026-09-25');
  assert.equal(range.endsAt, '07:40');
  const saved = saveEvent(book, book.days[0].id, { ...range, title: event.title }, event.id);
  assert.equal(saved.days[0].events[0].displayEndsAt, undefined);
  assert.match(eventTimeLabel(saved.days[0].events[0], book.days[0].date), /07:40 \+1/);
});

test('repeated autosaves of a new draft keep one event ID and null status defaults', () => {
  const book = seed(), day = book.days[1];
  const fields = { title: '新的交通', type: '交通', reservationStatus: null, paymentStatus: null, transport: { mode: '铁路', from: 'A', to: 'B', code: '', segments: [] } };
  const first = saveEvent(book, day.id, fields, 'new-draft-id', true);
  const second = saveEvent(first, day.id, { ...fields, title: '继续修改' }, 'new-draft-id', true);
  assert.equal(second.days[1].events.filter(event => event.id === 'new-draft-id').length, 1);
  assert.equal(second.days[1].events.at(-1).reservationStatus, null);
  assert.equal(second.days[1].events.at(-1).paymentStatus, null);
});

test('dragging before and after targets has no off-by-one and never duplicates events', () => {
  const book = seed(), day = book.days[1], ids = day.events.map(event => event.id);
  const after = reorderEvent(book, day.id, ids[0], ids[1], 'after');
  assert.deepEqual(after.days[1].events.slice(0, 2).map(event => event.id), [ids[1], ids[0]]);
  const restored = reorderEvent(after, day.id, ids[0], ids[1], 'before');
  assert.deepEqual(restored.days[1].events.map(event => event.id), ids);
  assert.deepEqual(book.days[1].events.map(event => event.id), ids);
});

test('changing flight transport to rail cannot leave the old flight legs in the summary', () => {
  const book = seed(), event = book.days[0].events[0];
  const next = saveEvent(book, book.days[0].id, { transport: { mode: '铁路', from: 'A', to: 'B', code: 'R12', segments: [] } }, event.id);
  assert.equal(next.days[0].events[0].flightLegs, undefined);
  const record = next.transport.find(record => record.id === event.transportRecordId);
  assert.equal(record.legs, undefined); assert.equal(record.kind, '铁路');
});

test('AI import preserves photos, detects stale revisions and previews actual changed events', () => {
  const book = seed(); book.days[0].photos.push({ id: 'kept-photo', name: 'photo.jpg', type: 'image/jpeg' });
  const packet = editablePacket({ id: book.id, localRevision: 7, document: book });
  packet.days[0].events[0].title = 'AI 改过的名称';
  assert.throws(() => applyEditablePacket(book, packet, 8), /已有新修改/);
  const next = applyEditablePacket(book, packet, 7);
  assert.equal(next.days[0].photos[0].id, 'kept-photo');
  assert.equal(next.days[0].events[0].title, 'AI 改过的名称');
  assert.equal(summarizeEditableChanges(book, next).find(change => change.title === 'AI 改过的名称').action, '修改');
});

test('PDF attachments survive backup parsing with fresh immutable IDs and missing bytes are rejected', async () => {
  const book = seed();
  book.days[0].events[0].attachments = [{ id: 'booking-pdf', name: 'booking.pdf', type: 'application/pdf', size: 14 }];
  const backup = { format: 'across-backup', version: 1, document: book, files: [{ id: 'booking-pdf', data: `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n%%EOF').toString('base64')}` }] };
  const restored = await readBackup(new File([JSON.stringify(backup)], 'test.across'), book.id);
  assert.notEqual(restored.document.days[0].events[0].attachments[0].id, 'booking-pdf');
  assert.equal(restored.files[0].id, restored.document.days[0].events[0].attachments[0].id);
  assert.match(await restored.files[0].blob.text(), /^%PDF/);
  backup.files = [];
  await assert.rejects(readBackup(new File([JSON.stringify(backup)], 'test.across'), book.id), /缺少照片或附件/);
  assert.equal(book.days[0].events[0].attachments[0].id, 'booking-pdf');
});
