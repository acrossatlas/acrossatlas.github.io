import { readPhoto } from './notebook-store.js';
import { notebookAssets, validateNotebook } from './notebook.js';

function dataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('备份照片读取失败。'));
    reader.readAsDataURL(blob);
  });
}

export async function downloadBackup(document) {
  const files = [];
  for (const photo of notebookAssets(document)) {
    const blob = await readPhoto(document.id, photo.id);
    if (!blob) throw new Error('有照片或预订附件无法读取，备份未完成。');
    files.push({ id: photo.id, data: await dataUrl(blob) });
  }
  const blob = new Blob([JSON.stringify({ format: 'across-backup', version: 1, document, files })], { type: 'application/json' });
  if (blob.size > 200 * 1024 * 1024) throw new Error('备份超过 200 MB，当前版本暂不支持这么大的备份。');
  const url = URL.createObjectURL(blob), anchor = window.document.createElement('a');
  anchor.href = url; anchor.download = `${document.id}-${new Date().toISOString().slice(0, 10)}.across`;
  anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function readBackup(file, bookId) {
  if (file.size > 200 * 1024 * 1024) throw new Error('备份超过 200 MB，当前版本暂不支持这么大的备份。');
  let backup;
  try { backup = JSON.parse(await file.text()); } catch { throw new Error('无法读取备份文件。'); }
  if (backup?.format !== 'across-backup' || backup.version !== 1 || !Array.isArray(backup.files)) throw new Error('请选择 Across 导出的备份文件。');
  validateNotebook(backup.document);
  if (backup.document.id !== bookId) throw new Error('这份备份属于另一趟旅行。');
  const expected = new Map(notebookAssets(backup.document).map(asset => [asset.id, asset]));
  const files = [];
  for (const file of backup.files) {
    const metadata = expected.get(file.id);
    if (!metadata || !/^data:(?:image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/]*={0,2}$/.test(file.data)) throw new Error('备份中的附件格式错误。');
    expected.delete(file.id);
    const [header, body] = file.data.split(',');
    const decoded = atob(body);
    if (decoded.length > 20 * 1024 * 1024 || header.slice(5, header.indexOf(';')) !== metadata.type) throw new Error('备份中的附件大小或格式错误。');
    files.push({ id: file.id, blob: new Blob([Uint8Array.from(decoded, char => char.charCodeAt(0))], { type: header.slice(5, header.indexOf(';')) }) });
  }
  if (expected.size) throw new Error('备份缺少照片或附件，未替换当前内容。');
  // Imported blobs receive new IDs so restoring a backup cannot replace bytes
  // still referenced by the version kept for undo.
  const importedIds = new Map(files.map(file => [file.id, crypto.randomUUID()]));
  for (const asset of notebookAssets(backup.document)) asset.id = importedIds.get(asset.id);
  for (const file of files) file.id = importedIds.get(file.id);
  return { document: backup.document, files };
}
