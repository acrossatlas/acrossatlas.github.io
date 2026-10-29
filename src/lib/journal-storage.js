let databasePromise;
const metadataKey = tripId => `across:journal:summary:${tripId}`;

function database() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('across-journals', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('projects', { keyPath: 'tripId' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { databasePromise = null; reject(request.error); };
      request.onblocked = () => { databasePromise = null; reject(new Error('请关闭其他 Across 页面后重试保存。')); };
    });
  }
  return databasePromise;
}

export async function loadJournal(tripId) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('projects', 'readonly').objectStore('projects').get(tripId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveJournal(project) {
  const db = await database();
  const saved = { ...project, savedAt: new Date().toISOString() };
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    transaction.objectStore('projects').put(saved);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('保存中断，请重试。'));
  });
  try {
    localStorage.setItem(metadataKey(project.tripId), JSON.stringify({ title: project.title, pages: project.pages.length, photos: project.pages.reduce((sum, page) => sum + page.frames.length, 0), savedAt: saved.savedAt }));
  } catch { /* The project is already safely stored in IndexedDB. */ }
  return saved.savedAt;
}

export function journalSummary(tripId) {
  try { return JSON.parse(localStorage.getItem(metadataKey(tripId))) ?? null; }
  catch { return null; }
}

export async function readPhotoFile(file) {
  const src = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`无法读取 ${file.name}`));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = src;
  try { await image.decode(); }
  catch { throw new Error(`${file.name} 无法打开，请使用 JPG、PNG 或 WebP 照片。`); }
  return { id: crypto.randomUUID(), name: file.name, src, width: image.naturalWidth, height: image.naturalHeight };
}
