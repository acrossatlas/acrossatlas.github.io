import { composePageFrames, packPrintSheets, photoCrop, printItems, TN_PAGE } from './journal.js';

const imageCache = new Map();
async function loadImage(src) {
  if (!imageCache.has(src)) imageCache.set(src, (async () => {
    const image = new Image();
    image.src = src;
    await image.decode();
    return image;
  })());
  return imageCache.get(src);
}

async function croppedPhoto(asset, frame) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(frame.width / 25.4 * 300));
  canvas.height = Math.max(1, Math.round(frame.height / 25.4 * 300));
  const context = canvas.getContext('2d');
  const crop = photoCrop(asset, frame);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(await loadImage(asset.src), crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function cropMarks(pdf, x, y, width, height) {
  pdf.setDrawColor(120);
  pdf.setLineWidth(0.15);
  for (const [cornerX, cornerY, signX, signY] of [[x, y, -1, -1], [x + width, y, 1, -1], [x, y + height, -1, 1], [x + width, y + height, 1, 1]]) {
    pdf.line(cornerX + signX * 0.7, cornerY, cornerX + signX * 2, cornerY);
    pdf.line(cornerX, cornerY + signY * 0.7, cornerX, cornerY + signY * 2);
  }
}

function grayPhoto(pdf, item, asset, x, y) {
  const tone = 220 - (asset?.tone ?? item.number % 5) * 7;
  pdf.setFillColor(tone, tone, tone);
  pdf.rect(x, y, item.width, item.height, 'F');
  pdf.setTextColor(110);
  pdf.setFontSize(Math.min(10, item.width / 4));
  pdf.text(`P${String(item.number).padStart(2, '0')}`, x + item.width / 2, y + item.height / 2, { align: 'center' });
}

function drawText(context, text) {
  context.save();
  context.beginPath();
  context.rect(text.x, text.y, text.width, text.height);
  context.clip();
  context.font = `${text.fontWeight || 400} ${text.fontSize}px ${text.fontFamily === 'mono' ? '"Courier New", "PingFang SC", monospace' : '"Helvetica Neue", "PingFang SC", Arial, sans-serif'}`;
  context.fillStyle = text.color || '#242424';
  context.textBaseline = 'top';
  let y = text.y;
  for (const paragraph of text.content.split('\n')) {
    let line = '';
    for (const character of paragraph) {
      if (context.measureText(line + character).width > text.width && line) {
        context.fillText(line, text.x, y);
        y += text.fontSize * 1.12;
        line = character;
      } else line += character;
    }
    context.fillText(line, text.x, y);
    y += text.fontSize * 1.12;
  }
  context.restore();
}

export async function buildJournalPdf(project, { mode = 'photos', marks = true } = {}) {
  const { jsPDF } = await import('jspdf');
  const assets = new Map(project.assets.map(asset => [asset.id, asset]));
  const items = printItems(project);
  const pdf = new jsPDF({ unit: 'mm', format: mode === 'photos' ? 'a4' : [TN_PAGE.width, TN_PAGE.height], orientation: 'portrait', compress: true, floatPrecision: 6 });
  pdf.setProperties({ title: project.title, creator: 'across / travel zine' });
  pdf.setDisplayMode('fullwidth');
  pdf.viewerPreferences({ PrintScaling: 'None' });
  try {
    if (mode === 'photos') {
      const sheets = packPrintSheets(items);
      for (const [sheetIndex, sheet] of sheets.entries()) {
        if (sheetIndex) pdf.addPage('a4', 'portrait');
        pdf.setTextColor(45);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('across / photo print sheets', 10, 9);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(`A4  |  ACTUAL SIZE / 100%  |  ${sheetIndex + 1} / ${sheets.length}`, 200, 9, { align: 'right' });
        for (const item of sheet.items) {
          const asset = assets.get(item.assetId);
          if (asset?.src) pdf.addImage(await croppedPhoto(asset, item), 'JPEG', item.printX, item.printY, item.width, item.height, undefined, 'MEDIUM');
          else grayPhoto(pdf, item, asset, item.printX, item.printY);
          if (marks) cropMarks(pdf, item.printX, item.printY, item.width, item.height);
          pdf.setTextColor(100);
          pdf.setFontSize(6.5);
          const label = `P${String(item.number).padStart(2, '0')} / PAGE ${String(item.pageIndex + 1).padStart(2, '0')} / ${item.width} x ${item.height} mm`;
          pdf.text(label, item.printX, item.printY + item.height + 3.5, { maxWidth: item.width });
        }
        pdf.setTextColor(120);
        pdf.setFontSize(6.5);
        pdf.text('Print at 100% / Actual size. Cut each photo and follow its page number in the notebook.', 10, 291);
      }
    } else {
      for (const [pageIndex, page] of project.pages.entries()) {
        if (pageIndex) pdf.addPage([TN_PAGE.width, TN_PAGE.height], 'portrait');
        const canvas = document.createElement('canvas');
        const scale = 300 / 25.4;
        canvas.width = Math.round(TN_PAGE.width * scale);
        canvas.height = Math.round(TN_PAGE.height * scale);
        const context = canvas.getContext('2d');
        context.scale(scale, scale);
        context.fillStyle = page.paper;
        context.fillRect(0, 0, TN_PAGE.width, TN_PAGE.height);
        for (const frame of composePageFrames(project, pageIndex)) {
          const item = items.find(item => item.id === frame.id);
          const asset = assets.get(frame.assetId);
          context.save();
          context.translate(frame.x + frame.width / 2, frame.y + frame.height / 2);
          context.rotate(frame.rotation * Math.PI / 180);
          if (asset?.src) context.drawImage(await croppedPhoto(asset, frame), -frame.width / 2, -frame.height / 2, frame.width, frame.height);
          else {
            const tone = 220 - (asset?.tone ?? item.number % 5) * 7;
            context.fillStyle = `rgb(${tone},${tone},${tone})`;
            context.fillRect(-frame.width / 2, -frame.height / 2, frame.width, frame.height);
            context.fillStyle = '#777777';
            context.font = '3px monospace';
            context.textAlign = 'center';
            context.fillText(`P${String(item.number).padStart(2, '0')}`, 0, 1);
          }
          context.restore();
        }
        for (const text of page.texts ?? []) drawText(context, text);
        pdf.addImage(canvas, 'JPEG', 0, 0, TN_PAGE.width, TN_PAGE.height, undefined, 'MEDIUM');
      }
    }
    return pdf;
  } finally { imageCache.clear(); }
}

export async function exportJournalPdf(project, options) {
  const pdf = await buildJournalPdf(project, options);
  pdf.save(`${project.title || 'across'}-${options.mode === 'pages' ? 'TN整页' : 'A4照片拼版'}.pdf`);
}

export function exportSizeList(project) {
  const assets = new Map(project.assets.map(asset => [asset.id, asset]));
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = [['照片编号', '手帐页码', '素材名称', '打印宽度(mm)', '打印高度(mm)', '页面X(mm)', '页面Y(mm)', '页面旋转(°)'],
    ...printItems(project).map(item => [`P${String(item.number).padStart(2, '0')}`, item.pageIndex + 1, assets.get(item.assetId)?.name ?? '灰色占位', item.width, item.height, item.x, item.y, item.rotation])];
  const url = URL.createObjectURL(new Blob(['\uFEFF', rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.title || 'across'}-照片尺寸清单.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
