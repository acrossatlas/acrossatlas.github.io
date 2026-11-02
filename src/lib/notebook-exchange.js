import { notebookAssets, saveEvent, validateNotebook } from './notebook.js';

export function editablePacket(record) {
  return { format: 'across-itinerary', version: 1, bookId: record.id, baseRevision: record.localRevision,
    instructions: '修改 events 中的字段，保留 id。新增事件使用唯一字母/数字/连字符 id，删除事件直接移除。交通在 transport.segments 中分段；预订和付款状态用 null、未预定/已预定、未付款/已付款。可选 location 为 {query: 与 navigation 或地点名相同的文本, coordinates: [经度, 纬度]}；交通分段可同样填写 fromLocation/toLocation，query 对应 from/to。不要修改现有附件 id。保留 bookId 与 baseRevision。',
    title: record.document.title,
    days: record.document.days.map(({ id, date, events }) => ({ id, date, events: structuredClone(events) })),
    checklist: structuredClone(record.document.checklist),
  };
}

export function applyEditablePacket(book, packet, revision) {
  if (packet?.format !== 'across-itinerary' || packet.version !== 1 || packet.bookId !== book.id) throw new Error('请选择这趟旅行导出的行程 JSON。');
  if (packet.baseRevision !== revision) throw new Error('导出后旅行本已有新修改，请重新导出并合并，避免覆盖当前内容。');
  if (!Array.isArray(packet.days) || packet.days.length !== book.days.length || packet.days.some((day, index) => day.id !== book.days[index].id || day.date !== book.days[index].date || !Array.isArray(day.events))) throw new Error('请保留这趟旅行原有的日期结构。');
  const assets = new Map(notebookAssets(book).map(asset => [asset.id, asset]));
  let next = structuredClone(book);
  next.title = packet.title ?? book.title;
  if (packet.checklist) next.checklist = structuredClone(packet.checklist);
  next.days.forEach((day, index) => { day.events = structuredClone(packet.days[index].events); });
  for (const day of next.days) for (const event of day.events) {
    for (const attachment of event.attachments ?? []) {
      if (!assets.has(attachment.id)) throw new Error('JSON 引用了不存在的预订附件，请先通过浏览器上传附件。');
      Object.assign(attachment, assets.get(attachment.id));
    }
    next = saveEvent(next, day.id, event, event.id);
  }
  return validateNotebook(next);
}

export function summarizeEditableChanges(current, next) {
  const entries = book => new Map(book.days.flatMap(day => day.events.map((event, index) => [event.id, { event, date: day.date, index }])));
  const before = entries(current), after = entries(next), changes = [];
  for (const [id, entry] of after) {
    const old = before.get(id);
    if (!old) changes.push({ action: '新增', title: entry.event.title });
    else if (JSON.stringify(old.event) !== JSON.stringify(entry.event)) changes.push({ action: '修改', title: entry.event.title });
    else if (old.date !== entry.date || old.index !== entry.index) changes.push({ action: '调整', title: entry.event.title });
  }
  for (const [id, entry] of before) if (!after.has(id)) changes.push({ action: '删除', title: entry.event.title });
  if (JSON.stringify(current.checklist) !== JSON.stringify(next.checklist)) changes.push({ action: '修改', title: 'Checklist' });
  return changes;
}

export function downloadEditablePacket(record) {
  const blob = new Blob([JSON.stringify(editablePacket(record), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = `${record.id}-itinerary.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
