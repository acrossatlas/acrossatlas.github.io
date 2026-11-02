// The editor, saved project and print exporter all use millimetres.
export const TN_PAGE = { width: 110, height: 210 };
export const PAPER_COLORS = ['#ffffff', '#f5f4ef', '#e8e9e6', '#f3f292'];

const legacyPageDecorations = new Set();
const legacyPageNumberPositions = new Set();
const decorationKey = ({ content }) => String(content ?? '').normalize('NFKC').toUpperCase().trim().replace(/\s+/g, ' ').replace(/\d+/g, '#');

function withoutPageDecorations(template, positions = []) {
  return {
    ...template,
    texts: (template.texts ?? []).filter(([x, y, , , content], index) => {
      if (!positions.includes(index)) return true;
      legacyPageDecorations.add(decorationKey({ content }));
      if (/^\d+$/.test(content.trim())) legacyPageNumberPositions.add(JSON.stringify([x, y]));
      return false;
    }),
  };
}

export const JOURNAL_TEMPLATES = [
  { id: 'story', name: '照片与独白', note: '上方图像，下方大字独白', frames: [[22, 10, 80, 65]], texts: [[7, 74, 96, 65, 'SOMEWHERE\nALONG\nTHE WAY.', 8, 'sans', 700], [23, 174, 73, 19, '那些停下来看的瞬间。\n一些照片，一些没有写完的话。', 2.5], [7, 198, 92, 5, 'FIELD NOTES                                      01', 1.8, 'mono']] },
  { id: 'contact', name: '六格底片', note: '窄间距与整齐的边缘', frames: [[8, 25, 46, 48], [56, 25, 46, 48], [8, 75, 46, 48], [56, 75, 46, 48], [8, 125, 46, 48], [56, 125, 46, 48]], texts: [[8, 8, 94, 10, 'CONTACT SHEET / 001', 2.3, 'mono'], [8, 183, 94, 15, 'Collected along the way.\n没有特别的顺序，都是想留下的。', 2.2, 'mono']] },
  { id: 'hero', name: '纵向主图', note: '细长主图与页边注记', frames: [[12, 10, 78, 185]], texts: [[94, 17, 12, 35, 'FIG.\n01\n\nON\nTHE\nROAD', 1.8, 'mono'], [12, 199, 80, 5, 'A PLACE TO REMEMBER.', 1.8, 'mono']] },
  { id: 'duo', name: '双图对话', note: '两张横图，保留底部留白', frames: [[8, 17, 94, 65], [8, 86, 94, 65]], texts: [[8, 157, 62, 20, '同一个地方，\n另一个瞬间。', 2.7], [8, 199, 94, 5, 'OBSERVATIONS / 002', 1.8, 'mono']] },
  { id: 'strip', name: '连续四帧', note: '像一段缓慢的镜头', frames: [[8, 31, 94, 35], [8, 69, 94, 35], [8, 107, 94, 35], [8, 145, 94, 35]], texts: [[8, 9, 94, 12, 'IN BETWEEN.', 4.6, 'sans', 700], [8, 191, 94, 8, '01 — 04 / THE WAY THERE', 1.9, 'mono']] },
  { id: 'mosaic', name: '错落四图', note: '大图定调，细节接续', frames: [[7, 10, 96, 82], [7, 96, 43, 58], [54, 96, 49, 87], [7, 158, 43, 32]], texts: [[54, 188, 49, 13, 'Things I noticed.\n路上拾到的细节。', 2, 'mono']] },
  { id: 'overlap', name: '错位留白', note: '两条对齐线，大片空白', frames: [[7, 12, 64, 86], [35, 107, 68, 77]], texts: [[75, 15, 28, 35, 'NOTES\nFROM\nELSEWHERE', 2.3, 'mono'], [7, 174, 24, 22, '一段路，\n慢慢走。', 2.3], [7, 199, 96, 5, 'TWO MOMENTS / ONE PLACE', 1.7, 'mono']] },
  { id: 'nine', name: '九格档案', note: '密集照片，小型档案', frames: Array.from({ length: 9 }, (_, i) => [7 + (i % 3) * 32.5, 23 + Math.floor(i / 3) * 49, 31, 47]), texts: [[7, 8, 96, 10, 'THE COLLECTED MOMENTS', 2.4, 'mono'], [7, 180, 96, 21, '01 / 09\nSome things are worth keeping.', 2.2, 'mono']] },
  { id: 'horizon', name: '下半场', note: '上方留白，下方横向图像', frames: [[0, 104, 110, 102]], texts: [[7, 9, 35, 17, 'ON\nTHE WAY', 5.3, 'sans', 700], [65, 10, 38, 20, 'LOCATION / —\nFRAME / 001\nFIELD NOTES', 1.8, 'mono'], [7, 91, 96, 10, '有时候，一张照片就够了。', 2.2, 'mono']] },
  { id: 'inset', name: '散页札记', note: '小图、边注与开放的空白', frames: [[23, 48, 61, 74]], texts: [[7, 19, 94, 19, 'FRAGMENTS\nOF A JOURNEY', 5, 'mono', 700], [7, 135, 44, 39, '路上收集的，\n不只是照片。\n\n也有声音、气味，\n和当时的心情。', 2.3], [67, 151, 35, 30, 'COLLECTED\nON THE ROAD.\n\nVOL. 01', 2, 'mono'], [7, 199, 94, 5, 'PERSONAL ARCHIVE', 1.8, 'mono']] },
  { id: 'blank', name: '自由空白', note: '从第一张照片开始', group: 'loose', frames: [] },
].map(template => withoutPageDecorations(template, {
  story: [2], contact: [0], hero: [0, 1], duo: [1], strip: [1],
  overlap: [2], nine: [0, 1], horizon: [1], inset: [2, 3],
}[template.id]));

export const JOURNAL_SPREADS = [
  { id: 'editorial', name: '图像与独白', note: '大字独白与双图叙事', pages: ['story', 'duo'] },
  { id: 'panorama', name: '一张图，跨两页', note: '中间横跨书脊，四周留白', custom: [
    { frames: [[28, 61, 164, 82, 0, true]], texts: [[8, 8, 94, 10, 'A MOMENT / A PLACE', 2, 'mono'], [8, 190, 94, 12, '把这一刻，留在两页之间。', 2.4]] },
    { frames: [], texts: [[65, 8, 38, 10, 'FIELD NOTES', 1.8, 'mono'], [17, 151, 72, 21, 'Somewhere along the way.\n这里可以写下照片背后的故事。', 2.3], [7, 198, 96, 5, 'TRAVEL ARCHIVE', 1.8, 'mono']] },
  ] },
  { id: 'portrait-detail', name: '主图与细节', note: '左边纵向主图，右边两个细节', custom: [
    { frames: [[9, 8, 91, 193]], texts: [[2, 42, 5, 32, 'F\nI\nG\n.\n0\n1', 1.5, 'mono']] },
    { frames: [[8, 30, 76, 64], [8, 100, 76, 65]], texts: [[89, 31, 17, 32, 'DETAIL\n01\n\nLOOK\nCLOSER.', 1.6, 'mono'], [89, 101, 17, 28, 'DETAIL\n02', 1.6, 'mono'], [8, 179, 92, 21, 'The whole, and the little things.\n风景里，还有很多很小的故事。', 2.2]] },
  ] },
  { id: 'offset-pair', name: '不对称的两页', note: '高低错落，留白相互呼应', custom: [
    { frames: [[8, 10, 64, 102]], texts: [[8, 117, 38, 10, 'FIG. 01', 2, 'mono'], [83, 119, 20, 12, '01', 5, 'sans'], [8, 197, 94, 5, 'A FEW THINGS I REMEMBER.', 1.7, 'mono']] },
    { frames: [[27, 31, 75, 160]], texts: [[7, 8, 95, 9, 'PERSONAL ARCHIVE / 002', 1.7, 'mono'], [7, 33, 15, 12, '02', 5, 'sans'], [27, 196, 75, 7, 'FIG. 02 / ANOTHER MOMENT', 1.7, 'mono']] },
  ] },
].map(spread => spread.custom ? {
  ...spread,
  custom: spread.custom.map((page, index) => withoutPageDecorations(page, {
    panorama: [[0], [0, 2]],
    'portrait-detail': [[0], [0, 1]],
    'offset-pair': [[0, 1, 2], [0, 1, 2]],
  }[spread.id]?.[index])),
} : spread);

export function journalPageTexts(page) {
  return (page.texts ?? []).filter(text => {
    if (text.role === 'body') return true;
    if (['header', 'footer', 'page-number'].includes(text.role)) return false;
    const key = decorationKey(text);
    if (key === '#') return !legacyPageNumberPositions.has(JSON.stringify([text.x, text.y]));
    return !legacyPageDecorations.has(key);
  });
}

// Always inspect legacy copy, including projects marked by the earlier migration.
// New body text has an explicit role so user-written content stays editable.
export function stripJournalPageDecorations(project) {
  let changed = project.decorationVersion !== 2;
  const pages = project.pages.map(page => {
    const texts = journalPageTexts(page);
    if (texts.length === (page.texts ?? []).length && texts.every(text => text.role === 'body')) return page;
    changed = true;
    return { ...page, texts: texts.map(text => text.role === 'body' ? text : { ...text, role: 'body' }) };
  });
  if (!changed) return project;
  return {
    ...project, decorationVersion: 2, pages,
  };
}

export const uid = () => globalThis.crypto?.randomUUID?.() ?? `j-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const overhangsSpine = frame => !frame.span && (frame.x < 0 || frame.x + frame.width > TN_PAGE.width);
export const roundMm = value => Math.round(value * 10) / 10;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Keep a frame on its page. With `side` (0 = left page, 1 = right page, given only
 * when the facing page exists) a photo may straddle the spine: it stays on the page
 * that holds its centre (the larger share) and never passes the book's outer edge.
 */
export function fitFrame(frame, side) {
  const rotation = clamp(Number(frame.rotation) || 0, -180, 180);
  const angle = rotation * Math.PI / 180;
  const pageWidth = frame.span ? TN_PAGE.width * 2 : TN_PAGE.width;
  let width = clamp(Number(frame.width) || 5, 5, frame.span ? 190 : pageWidth);
  let height = clamp(Number(frame.height) || 5, 5, TN_PAGE.height);
  const bounds = () => ({ width: Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle)), height: Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle)) });
  const initial = bounds();
  const scale = Math.min(1, pageWidth / initial.width, TN_PAGE.height / initial.height);
  width *= scale;
  height *= scale;
  const box = bounds();
  const insetX = (box.width - width) / 2;
  const insetY = (box.height - height) / 2;
  return {
    ...frame, rotation, width: roundMm(width), height: roundMm(height),
    x: roundMm(clamp(Number(frame.x) || 0,
      side === 1 && !frame.span ? -box.width / 2 + insetX : insetX,
      side === 0 && !frame.span ? pageWidth - box.width / 2 - insetX : pageWidth - width - insetX)),
    y: roundMm(clamp(Number(frame.y) || 0, insetY, TN_PAGE.height - height - insetY)),
  };
}

export function createFrame(values = {}) {
  return fitFrame({ id: uid(), x: 31, y: 72, width: 48, height: 64, rotation: 0, assetId: null, zoom: 1, offsetX: 0, offsetY: 0, ...values });
}

export function createText(values = {}) {
  return { ...createFrame({ x: 8, y: 20, width: 90, height: 30 }), role: 'body', content: '写下一些旅途中的片刻。', fontSize: 4, fontFamily: 'sans', fontWeight: 400, color: '#242424', ...values };
}

function templateContent(template, photos = []) {
  return {
    frames: template.frames.map(([x, y, width, height, rotation = 0, span = false], index) => createFrame({ x, y, width, height, rotation, span, assetId: photos[index]?.assetId ?? null })),
    texts: (template.texts ?? []).map(([x, y, width, height, content, fontSize, fontFamily = 'sans', fontWeight = 400]) => createText({ x, y, width, height, content, fontSize, fontFamily, fontWeight })),
  };
}

export function applyTemplate(page, templateId) {
  const template = JOURNAL_TEMPLATES.find(item => item.id === templateId) ?? JOURNAL_TEMPLATES[0];
  const photos = page.frames.filter(frame => frame.assetId);
  return {
    ...page, templateId: template.id,
    ...templateContent(template, photos),
  };
}

export function createPage(templateId = 'blank') {
  return applyTemplate({ id: uid(), paper: PAPER_COLORS[0], frames: [] }, templateId);
}

export function createSpread(spreadId) {
  const template = JOURNAL_SPREADS.find(spread => spread.id === spreadId) ?? JOURNAL_SPREADS[0];
  if (template.pages) return template.pages.map(id => ({ ...createPage(id), spreadId }));
  return template.custom.map(content => ({ id: uid(), paper: PAPER_COLORS[0], templateId: 'custom', spreadId, ...templateContent(content) }));
}

export function createJournal(tripId) {
  return {
    version: 1, decorationVersion: 2, tripId, title: '旅途中的一些片刻', savedAt: null,
    pages: createSpread('editorial'),
    assets: [],
  };
}

export function stripJournalDemoAssets(project) {
  const demoIds = new Set(project.assets.filter(asset => asset.demo && !asset.src).map(asset => asset.id));
  if (!demoIds.size) return project;
  return {
    ...project,
    assets: project.assets.filter(asset => !demoIds.has(asset.id)),
    pages: project.pages.map(page => ({
      ...page,
      frames: page.frames.map(frame => demoIds.has(frame.assetId) ? { ...frame, assetId: null } : frame),
    })),
  };
}

// Offsets are normalized to [-1, 1] so the crop remains valid at every frame size.
export function photoCrop(asset, frame) {
  const ratio = frame.width / frame.height;
  const zoom = clamp(Number(frame.zoom) || 1, 1, 4);
  let width = asset.width;
  let height = width / ratio;
  if (height > asset.height) { height = asset.height; width = height * ratio; }
  width /= zoom;
  height /= zoom;
  return {
    x: (asset.width - width) * (clamp(frame.offsetX || 0, -1, 1) + 1) / 2,
    y: (asset.height - height) * (clamp(frame.offsetY || 0, -1, 1) + 1) / 2,
    width, height,
  };
}

export function printItems(project) {
  return project.pages.flatMap((page, pageIndex) => page.frames.map(frame => ({ ...frame, pageIndex, number: 0, paper: page.paper })) ).map((frame, index) => ({ ...frame, number: index + 1 }));
}

export function composePageFrames(project, pageIndex) {
  const start = Math.floor(pageIndex / 2) * 2;
  return project.pages.slice(start, start + 2).flatMap((page, offset) => page.frames
    .map(frame => ({ ...frame, x: frame.x + (start + offset - pageIndex) * TN_PAGE.width })))
    .filter(frame => frame.x + frame.width > 0 && frame.x < TN_PAGE.width);
}

// MaxRects packing, without rotating the photos. The padding includes a caption
// and space for crop marks; photos retain their exact dimensions from the book.
export function packPrintSheets(items) {
  const sheets = [];
  const sorted = [...items].sort((a, b) => b.width * b.height - a.width * a.height || a.number - b.number);
  for (const item of sorted) {
    const width = item.width + 8;
    const height = item.height + 11;
    if (!Number.isFinite(width + height) || width > 198 || height > 271 || item.width <= 0 || item.height <= 0) throw new Error('照片尺寸超过 A4 可打印范围，请缩小后重试。');
    let placement;
    for (const sheet of sheets) {
      const matches = sheet.free.filter(rect => rect.width >= width && rect.height >= height)
        .sort((a, b) => Math.min(a.width - width, a.height - height) - Math.min(b.width - width, b.height - height));
      if (matches.length) { placement = { sheet, rect: matches[0] }; break; }
    }
    if (!placement) {
      const sheet = { items: [], free: [{ x: 10, y: 18, width: 198, height: 271 }] };
      sheets.push(sheet);
      placement = { sheet, rect: sheet.free[0] };
    }
    const { sheet, rect } = placement;
    const occupied = { x: rect.x, y: rect.y, width, height };
    const next = [];
    for (const free of sheet.free) {
      if (occupied.x >= free.x + free.width || occupied.x + width <= free.x || occupied.y >= free.y + free.height || occupied.y + height <= free.y) { next.push(free); continue; }
      if (occupied.x > free.x) next.push({ ...free, width: occupied.x - free.x });
      if (occupied.x + width < free.x + free.width) next.push({ ...free, x: occupied.x + width, width: free.x + free.width - occupied.x - width });
      if (occupied.y > free.y) next.push({ ...free, height: occupied.y - free.y });
      if (occupied.y + height < free.y + free.height) next.push({ ...free, y: occupied.y + height, height: free.y + free.height - occupied.y - height });
    }
    sheet.free = next.filter((candidate, index) => !next.some((other, otherIndex) => otherIndex !== index && other.x <= candidate.x && other.y <= candidate.y && other.x + other.width >= candidate.x + candidate.width && other.y + other.height >= candidate.y + candidate.height && (otherIndex < index || other.width > candidate.width || other.height > candidate.height)));
    sheet.items.push({ ...item, printX: rect.x, printY: rect.y });
  }
  return sheets.map(({ items: sheetItems }) => ({ items: sheetItems }));
}
