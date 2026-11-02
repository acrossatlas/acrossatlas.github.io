import { notebookAssets, validateNotebook } from './notebook.js';
import { recordChange, retainedDocuments, switchVersion } from './notebook-versions.js';

let connection;
function database() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('across-notebooks', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('notebooks', { keyPath: 'id' });
      request.result.createObjectStore('photos');
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); connection = undefined; };
      resolve(request.result);
    };
    request.onerror = () => { connection = undefined; reject(new Error('无法打开本机存储，请检查浏览器隐私和存储设置。')); };
  });
  return connection;
}

async function change(id, operation) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['notebooks', 'photos'], 'readwrite');
    const books = tx.objectStore('notebooks'), photos = tx.objectStore('photos');
    let result, failure;
    const get = books.get(id);
    get.onsuccess = () => {
      try { result = operation(get.result, books, photos); }
      catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () => reject(failure ?? new Error('保存失败，可能是本机存储空间不足。请释放空间后重试。'));
  });
}

export function openNotebook(seed) {
  return change(seed.id, (stored, books) => {
    if (stored?.deletedAt) throw new Error('这趟行程已删除。');
    if (stored) { validateNotebook(stored.document); return stored; }
    const record = { id: seed.id, document: validateNotebook(structuredClone(seed)), localRevision: 0, history: [], updatedAt: null };
    books.put(record);
    return record;
  });
}

function requireRevision(stored, expected) {
  if (stored?.deletedAt) throw new Error('这趟行程已在另一页面删除。');
  if (!stored || stored.localRevision !== expected) throw new Error('另一页面已修改这本旅行本。请关闭编辑框并刷新，再重新修改；本次输入尚未保存。');
}

function retainedPhotoIds(record) {
  return new Set(retainedDocuments(record).flatMap(book => notebookAssets(book).map(asset => asset.id)));
}

function collectPhotos(record, store) {
  const retained = retainedPhotoIds(record);
  const prefix = `${record.id}/`;
  const cursor = store.openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  cursor.onsuccess = () => {
    const entry = cursor.result;
    if (!entry) return;
    if (!retained.has(String(entry.key).slice(prefix.length))) entry.delete();
    entry.continue();
  };
}

export function writeNotebook(id, expected, document, label, files = [], options = {}) {
  validateNotebook(document);
  if (document.id !== id) throw new Error('旅行本编号不一致。');
  return change(id, (stored, books, photos) => {
    requireRevision(stored, expected);
    const next = { ...recordChange(stored, document, { label, source: options.source, groupId: options.groupId ?? null }), localRevision: stored.localRevision + 1, updatedAt: new Date().toISOString() };
    files.forEach(({ id: photoId, blob }) => photos.put(blob, `${id}/${photoId}`));
    books.put(next);
    collectPhotos(next, photos);
    return next;
  });
}

/** Switch the visible document to another saved version (see notebook-versions.js). */
export function switchNotebookVersion(id, expected, versionId) {
  return change(id, (stored, books) => {
    requireRevision(stored, expected);
    const next = { ...switchVersion(stored, versionId), localRevision: stored.localRevision + 1, updatedAt: new Date().toISOString() };
    validateNotebook(next.document);
    books.put(next);
    return next;
  });
}

export function deleteNotebook(id, expected) {
  return change(id, (stored, books, photos) => {
    requireRevision(stored, expected);
    const deletedAt = new Date().toISOString();
    // Keep a tombstone so public seed data and stale tabs cannot recreate it.
    const deleted = { id, document: null, deletedAt, updatedAt: deletedAt, localRevision: stored.localRevision + 1, history: [] };
    books.put(deleted);
    const prefix = `${id}/`;
    const cursor = photos.openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
    cursor.onsuccess = () => { const entry = cursor.result; if (entry) { entry.delete(); entry.continue(); } };
    return deleted;
  });
}

export async function readPhoto(bookId, id) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('photos').objectStore('photos').get(`${bookId}/${id}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('照片无法读取，请刷新重试。'));
  });
}

export async function listNotebooks() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('notebooks').objectStore('notebooks').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('旅行本列表无法读取，请刷新重试。'));
  });
}
