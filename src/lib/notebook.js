import { mapEventSignature, validCoordinates } from './itinerary-map.js';

export const NOTEBOOK_VERSION = 2;
export const HISTORY_LIMIT = 20;
export const EVENT_TYPES = ['行程', '交通', '住宿', '用餐'];
export const RESERVATION_STATES = ['', '未预定', '已预定'];
export const PAYMENT_STATES = ['', '未付款', '已付款'];
export const TRANSPORT_MODES = ['航班', '铁路', '自驾', '公交', '渡轮', '步行', '其他'];
export const ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function compactEventDetail(event) {
  let detail = event.detail ?? '';
  for (const group of ['activity', 'stay', 'dining']) for (const value of Object.values(event[group] ?? {})) {
    if (typeof value === 'string' && value.trim() && !detail.includes(value.trim())) detail += `${detail ? '\n' : ''}${value.trim()}`;
  }
  return detail;
}

export function notebookAssets(book) {
  return book.days.flatMap(day => [...day.photos, ...day.events.flatMap(event => event.attachments ?? [])]);
}

export function eventSchedule(event, day) {
  let endsAt = event?.endsAt ?? '', endsOn = event?.endsOn ?? day;
  const display = event?.displayEndsAt?.match(/^(\d{2}:\d{2})\s*(?:\+(\d+))?$/);
  if (display) {
    endsAt = display[1];
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(display[2] ?? 0));
    endsOn = date.toISOString().slice(0, 10);
  }
  return { startsOn: event?.startsOn ?? day, startsAt: event?.startsAt ?? '', endsOn, endsAt };
}

export function eventTimeLabel(event, day) {
  if (!event.startsAt) return event.timeNote || '时间待定';
  let end = event.displayEndsAt ?? event.endsAt;
  if (!event.displayEndsAt && event.endsAt && event.endsOn && day && event.endsOn !== day) {
    const offset = Math.round((Date.parse(event.endsOn) - Date.parse(day)) / 86400000);
    end += offset > 0 ? ` +${offset}` : ` · ${event.endsOn.slice(5).replace('-', '.')}`;
  }
  return `${event.startsAt}${end ? ` — ${end}` : ''}${event.timeNote ? ` · ${event.timeNote}` : ''}`;
}

export function createNotebook({ journey, dates, events, checklist, transport, stays }) {
  return {
    schemaVersion: NOTEBOOK_VERSION,
    id: journey.id,
    title: journey.title ?? journey.destinations.join(' '),
    destinations: journey.destinations,
    startsOn: journey.startsOn,
    endsOn: journey.endsOn,
    sectionLabels: structuredClone(journey.sectionLabels ?? {}), sectionDividers: [...(journey.sectionDividers ?? [])],
    days: dates.map(day => ({ id: day.key, date: day.key, label: day.label, events: (events[day.key] ?? []).map(event => {
      const migrated = structuredClone(event);
      if (migrated.startsAt && !/^([01]\d|2[0-3]):[0-5]\d$/.test(migrated.startsAt)) {
        migrated.timeNote = migrated.startsAt;
        migrated.startsAt = '';
      }
      return migrated;
    }), photos: [] })),
    checklist: structuredClone(checklist), transport: structuredClone(transport), stays: structuredClone(stays),
  };
}

export function safeLink(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function validateNotebook(book) {
  const fail = message => { throw new Error(message); };
  if (!book || book.schemaVersion !== NOTEBOOK_VERSION || !/^[a-zA-Z0-9-]+$/.test(book.id ?? '')) fail('旅行本格式不受支持。');
  if (typeof book.title !== 'string' || !Array.isArray(book.days) || !book.days.length || book.days.length > 366) fail('旅行本缺少有效的日期。');
  if (!Array.isArray(book.destinations) || !Array.isArray(book.transport) || !Array.isArray(book.stays)) fail('旅行基本信息格式错误。');
  if (!validDate(book.startsOn) || !validDate(book.endsOn) || book.endsOn < book.startsOn) fail('旅行日期无效。');
  const days = new Set(), events = new Set(), photos = new Set();
  for (const day of book.days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date ?? '') || Number.isNaN(Date.parse(day.date)) || new Date(day.date).toISOString().slice(0, 10) !== day.date || day.id !== day.date || days.has(day.id)) fail('日期无效或重复。');
    days.add(day.id);
    if (!Array.isArray(day.events) || !Array.isArray(day.photos)) fail('行程或照片格式错误。');
    for (const event of day.events) {
      if (!/^[a-zA-Z0-9-]+$/.test(event.id ?? '') || events.has(event.id)) fail('行程编号重复或无效。');
      events.add(event.id);
      if (typeof event.title !== 'string' || !event.title.trim() || event.title.length > 500) fail('请填写行程名称（最多 500 字）。');
      for (const key of ['startsAt', 'endsAt']) if (event[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(event[key])) fail('时间格式应为 HH:mm。');
      for (const field of ['type', 'navigation', 'detail', 'timeNote', 'bookingUrl']) if (event[field] != null && (typeof event[field] !== 'string' || event[field].length > 10000)) fail('行程内容格式错误。');
      if (event.country != null && !/^[A-Z]{2}$/.test(event.country)) fail('国家代码格式错误。');
      const checkLocation = location => { if (location != null && (typeof location.query !== 'string' || !validCoordinates(location.coordinates))) fail('地点坐标格式错误。'); };
      checkLocation(event.location);
      if (event.bookingUrl && !safeLink(event.bookingUrl)) fail('预订链接应以 https:// 或 http:// 开头。');
      for (const field of ['startsOn', 'endsOn']) if (event[field] && (!/^\d{4}-\d{2}-\d{2}$/.test(event[field]) || Number.isNaN(Date.parse(event[field])) || new Date(event[field]).toISOString().slice(0, 10) !== event[field])) fail('行程日期无效。');
      for (const [key, states] of [['reservationStatus', RESERVATION_STATES], ['paymentStatus', PAYMENT_STATES]]) if (event[key] != null && event[key] !== '不适用' && !states.includes(event[key])) fail('预订或付款状态无效。');
      if (event.attachments && !Array.isArray(event.attachments)) fail('附件格式错误。');
      if (event.attachments?.length > 10) fail('每项安排最多保留 10 个附件。');
      for (const attachment of event.attachments ?? []) {
        if (!/^[a-zA-Z0-9-]+$/.test(attachment.id ?? '') || photos.has(attachment.id) || !ATTACHMENT_TYPES.includes(attachment.type) || typeof attachment.name !== 'string') fail('附件编号或格式错误。');
        photos.add(attachment.id);
      }
      if (event.transport) {
        if (typeof event.transport !== 'object' || !Array.isArray(event.transport.segments) || event.transport.segments.length > 30) fail('交通分段格式错误。');
        for (const key of ['mode', 'from', 'to', 'code']) if (event.transport[key] != null && typeof event.transport[key] !== 'string') fail('交通字段错误。');
        const ids = new Set();
        for (const segment of event.transport.segments) {
          if (typeof segment.id !== 'string' || ids.has(segment.id)) fail('交通分段编号重复。');
          ids.add(segment.id);
          for (const key of ['from', 'to', 'mode', 'code', 'detail', 'departsOn', 'arrivesOn', 'depart', 'arrive']) if (segment[key] != null && typeof segment[key] !== 'string') fail('交通分段字段错误。');
          checkLocation(segment.fromLocation); checkLocation(segment.toLocation);
        }
      }
      for (const type of ['activity', 'stay', 'dining']) if (event[type] != null && (typeof event[type] !== 'object' || Array.isArray(event[type]) || Object.values(event[type]).some(value => typeof value !== 'string'))) fail('分类信息应为文本字段。');
    }
    for (const photo of day.photos) {
      if (!/^[a-zA-Z0-9-]+$/.test(photo.id ?? '') || photos.has(photo.id)) fail('照片编号重复或无效。');
      if (!['image/jpeg', 'image/webp'].includes(photo.type) || typeof photo.name !== 'string') fail('照片格式不受支持。');
      photos.add(photo.id);
    }
  }
  if (!Array.isArray(book.checklist)) fail('清单格式错误。');
  for (const [date, name] of Object.entries(book.sectionLabels ?? {})) if (!days.has(date) || typeof name !== 'string' || !name.trim() || name.length > 100) fail('分隔名称或位置无效。');
  const checklistIds = new Set();
  for (const group of book.checklist) {
    if (!['documents', 'packing'].includes(group.variant) || typeof group.title !== 'string') fail('清单分组格式错误。');
    const items = group.groups ? group.groups.flatMap(subgroup => subgroup.items ?? []) : group.items;
    if (!Array.isArray(items)) fail('清单条目格式错误。');
    for (const item of items) {
      if (typeof item.id !== 'string' || checklistIds.has(item.id) || typeof item.label !== 'string' || !item.label.trim()) fail('清单条目名称缺失或编号重复。');
      if (item.detail != null && typeof item.detail !== 'string') fail('清单说明格式错误。');
      checklistIds.add(item.id);
    }
  }
  return book;
}

export function saveEvent(book, dayId, fields, eventId, allowCreate = false) {
  const next = structuredClone(book);
  const target = next.days.find(day => day.id === dayId);
  if (!target) throw new Error('找不到目标日期。');
  let existing;
  if (eventId) {
    const source = next.days.find(day => day.events.some(event => event.id === eventId));
    if (!source && !allowCreate) throw new Error('这项行程已被修改，请重新打开。');
    existing = source?.events.find(event => event.id === eventId);
    if (source && source.id !== target.id) source.events = source.events.filter(event => event.id !== eventId);
  }
  const event = { ...existing, ...fields, id: eventId ?? crypto.randomUUID() };
  event.detail = compactEventDetail(event);
  for (const group of ['activity', 'stay', 'dining']) delete event[group];
  if (existing && Object.hasOwn(fields, 'endsAt') && fields.endsAt !== existing.endsAt) delete event.displayEndsAt;
  if (Object.hasOwn(fields, 'endsOn')) delete event.displayEndsAt;
  if (event.type === '交通' && fields.transport) {
    const segments = fields.transport.segments;
    if (segments.length) {
      const first = segments[0], last = segments.at(-1);
      event.transport = { ...event.transport, from: first.from, to: last.to, mode: first.mode || '', code: segments.length === 1 ? first.code || '' : '' };
      if (first.from.trim() && last.to.trim()) event.title = `${first.from.trim()} - ${last.to.trim()}`;
    }
    if (event.transport.mode === '航班' && segments.length) event.flightLegs = segments.map(({ from, to, depart, arrive, code }) => ({ from, to, depart, arrive, code: code || '' }));
    else { delete event.flightLegs; delete event.flightConnections; }
  }
  if (event.type !== '交通') { delete event.flightLegs; delete event.flightConnections; delete event.transportRecordId; }
  const index = target.events.findIndex(item => item.id === event.id);
  if (index < 0) target.events.push(event);
  else target.events[index] = event;
  const record = next.transport?.find(record => record.id === event.transportRecordId);
  if (record) {
    record.title = event.title;
    if (event.flightLegs) record.legs = structuredClone(event.flightLegs);
    else if (event.transport) {
      delete record.legs;
      record.kind = event.transport.mode || '交通';
      record.details = [['出发地', event.transport.from || '待填写'], ['目的地', event.transport.to || '待填写'], ['班次／车次', event.transport.code || '待填写']];
    }
    for (const day of next.days) for (const related of day.events) if (related.id !== event.id && related.transportRecordId === event.transportRecordId) {
      related.title = event.title;
      if (event.flightLegs) related.flightLegs = structuredClone(event.flightLegs);
    }
  }
  return validateNotebook(next);
}

export function deleteEvent(book, eventId) {
  const next = structuredClone(book);
  next.days.forEach(day => { day.events = day.events.filter(event => event.id !== eventId); });
  return next;
}

export function moveEvent(book, dayId, eventId, direction) {
  const next = structuredClone(book);
  const events = next.days.find(day => day.id === dayId)?.events;
  const index = events?.findIndex(event => event.id === eventId) ?? -1;
  if (index < 0 || index + direction < 0 || index + direction >= events.length) return book;
  [events[index], events[index + direction]] = [events[index + direction], events[index]];
  return next;
}

export function reorderEvent(book, dayId, eventId, targetId, position = 'before') {
  if (eventId === targetId) return book;
  const next = structuredClone(book), day = next.days.find(day => day.id === dayId);
  const index = day?.events.findIndex(event => event.id === eventId) ?? -1;
  if (index < 0 || !day.events.some(event => event.id === targetId)) throw new Error('行程已变化，请重新拖动。');
  const [event] = day.events.splice(index, 1);
  const target = day.events.findIndex(event => event.id === targetId);
  day.events.splice(target + (position === 'after' ? 1 : 0), 0, event);
  return next;
}

export function hasChangedRoute(events, original) {
  return mapEventSignature(events) !== mapEventSignature(original);
}

export function notebookFromJourney(journey) {
  const seed = createNotebook({ journey, dates: journey.dates, events: journey.dayEvents,
    checklist: [{ title: '证件', variant: 'documents', items: journey.documentChecklist ?? [] }, { title: '行李', variant: 'packing', groups: journey.packingChecklistGroups ?? [] }],
    transport: journey.transportRecords ?? [], stays: journey.stayRecords ?? [],
  });
  // Migrate checklist selections without writing anything back to the public source.
  for (const group of seed.checklist) {
    try {
      const selected = JSON.parse(localStorage.getItem(`across-atlas:${journey.startsOn}:checklist:${group.variant}`));
      if (Array.isArray(selected)) (group.groups?.flatMap(group => group.items) ?? group.items).forEach(item => { item.checked = selected.includes(item.id); });
    } catch { /* Legacy browser storage may be unavailable. */ }
  }
  return validateNotebook(seed);
}

export function journeyFromNotebook(book, original) {
  return { ...original, title: book.title, startsOn: book.startsOn, endsOn: book.endsOn,
    sectionLabels: book.sectionLabels ?? original.sectionLabels ?? {}, sectionDividers: book.sectionDividers ?? original.sectionDividers ?? [],
    dates: book.days.map(day => ({ key: day.date, label: day.label ?? day.date.slice(5).replace('-', '.') })),
    dayEvents: Object.fromEntries(book.days.map(day => [day.date, day.events])),
    documentChecklist: book.checklist.find(group => group.variant === 'documents')?.items ?? [],
    packingChecklistGroups: book.checklist.find(group => group.variant === 'packing')?.groups ?? [],
    transportRecords: book.transport, stayRecords: book.stays,
  };
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function shiftDate(value, offset) {
  const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10);
}

export function resizeNotebookDates(book, startsOn, endsOn) {
  if (!validDate(startsOn) || !validDate(endsOn) || endsOn < startsOn) throw new Error('请选择有效的起止日期。');
  const count = Math.round((Date.parse(endsOn) - Date.parse(startsOn)) / 86400000) + 1;
  if (count > 366) throw new Error('一趟旅行最多 366 天。');
  if (book.days.slice(count).some(day => day.events.length || day.photos.length)) throw new Error('缩短后的日期外还有行程或照片，请先移走这些内容。');
  const next = structuredClone(book), offset = Math.round((Date.parse(startsOn) - Date.parse(book.startsOn)) / 86400000);
  const oldLabels = next.sectionLabels ?? {}, oldDividers = next.sectionDividers ?? [];
  const labels = {}, dividers = [];
  next.days = Array.from({ length: count }, (_, index) => {
    const old = next.days[index], date = shiftDate(startsOn, index);
    if (oldLabels[old?.date]) labels[date] = oldLabels[old.date];
    if (oldDividers.includes(old?.date)) dividers.push(date);
    const day = old ?? { events: [], photos: [] };
    for (const event of day.events) {
      for (const field of ['startsOn', 'endsOn']) if (validDate(event[field])) event[field] = shiftDate(event[field], offset);
      for (const segment of event.transport?.segments ?? []) for (const field of ['departsOn', 'arrivesOn']) if (validDate(segment[field])) segment[field] = shiftDate(segment[field], offset);
    }
    return { ...day, id: date, date, label: date.slice(5).replace('-', '.') };
  });
  next.startsOn = startsOn; next.endsOn = endsOn; next.sectionLabels = labels; next.sectionDividers = dividers;
  for (const record of [...next.transport, ...next.stays]) for (const field of ['startsOn', 'endsOn']) if (validDate(record[field])) record[field] = shiftDate(record[field], offset);
  return validateNotebook(next);
}

export function createEmptyNotebook(title, startsOn, endsOn) {
  if (!title.trim()) throw new Error('请填写旅行名称。');
  const book = { schemaVersion: NOTEBOOK_VERSION, id: `trip-${crypto.randomUUID()}`, title: title.trim(), localOnly: true,
    destinations: [], startsOn, endsOn, days: [], sectionLabels: {}, sectionDividers: [], transport: [], stays: [],
    checklist: [{ title: '证件', variant: 'documents', items: [] }, { title: '行李', variant: 'packing', groups: [{ id: 'carry-on', title: '随身携带', items: [] }, { id: 'checked-luggage', title: '托运行李', items: [] }] }],
  };
  return resizeNotebookDates(book, startsOn, endsOn);
}

export function localJourneyBase(book) {
  return { id: book.id, title: book.title, status: 'planned', localOnly: true, destinations: book.destinations, countries: [], visits: [],
    startsOn: book.startsOn, endsOn: book.endsOn, dates: [], dayEvents: {}, documentChecklist: [], packingChecklistGroups: [], transportRecords: [], stayRecords: [],
  };
}
