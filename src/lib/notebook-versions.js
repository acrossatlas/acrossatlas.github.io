import { HISTORY_LIMIT } from './notebook.js';

// Version history for one notebook record.
//
// record.current  describes how the document on screen came to be: { id, label, at, source }.
// record.history  holds earlier versions, oldest first: { id, document, label, at, source }.
// record.checkout is set while an older version is being viewed: { latest, viewing }. The newest
//                 version is kept in `latest` so it can be switched back to without loss.
// source: 'human' | 'ai' | 'backup' | 'seed'.
//
// Records written before this format stored, per entry, the label of the change that
// *replaced* that document; normalizeVersions shifts those labels onto the right versions.

export const VERSION_FORMAT = 2;
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function sourceFromLabel(label = '') {
  if (label.includes('AI')) return 'ai';
  if (label.includes('备份')) return 'backup';
  return 'human';
}

export function normalizeVersions(record) {
  if (record.historyFormat === VERSION_FORMAT) return record;
  const old = record.history ?? [];
  const earliest = old.length >= HISTORY_LIMIT ? { label: '更早的版本', source: 'human' } : { label: '初始版本', source: 'seed' };
  const history = old.map((entry, index) => ({
    id: `legacy-${index}-${entry.at ?? ''}`, document: entry.document,
    ...(index === 0 ? { ...earliest, at: null } : { label: old[index - 1].label, at: old[index - 1].at, source: sourceFromLabel(old[index - 1].label) }),
  }));
  const last = old.at(-1);
  const current = last ? { id: `legacy-current-${last.at ?? ''}`, label: last.label, at: last.at, source: sourceFromLabel(last.label) } : { id: 'seed', label: '初始版本', at: null, source: 'seed' };
  return { ...record, history, current, checkout: null, historyFormat: VERSION_FORMAT };
}

/** The version shown as newest: the saved latest while viewing an older one, otherwise the document itself. */
export function latestVersion(record) {
  const base = normalizeVersions(record);
  return base.checkout?.latest ?? { ...base.current, document: base.document };
}

/** Newest first, each with `isLatest` / `isViewing`. */
export function listVersions(record) {
  const base = normalizeVersions(record), latest = latestVersion(base);
  const viewing = base.checkout ? base.checkout.viewing : latest.id;
  return [latest, ...[...base.history].reverse()].map(version => ({ ...version, isLatest: version.id === latest.id, isViewing: version.id === viewing }));
}

/** Apply a new document. While an older version is open, the saved latest is kept as a version first. */
export function recordChange(record, document, { label, source = 'human', groupId = null, at = new Date().toISOString() } = {}) {
  const base = normalizeVersions(record);
  let history = base.history, current;
  if (base.checkout) {
    history = [...history, base.checkout.latest];
    current = { id: newId(), label, at, source };
  } else if (groupId && base.historyGroup === groupId) {
    current = { ...base.current, at };
  } else {
    history = [...history, { ...base.current, document: base.document }];
    current = { id: newId(), label, at, source };
  }
  return { ...base, document, history: history.slice(-HISTORY_LIMIT), current, checkout: null, historyGroup: groupId };
}

/** Show any version; choosing the latest again returns to it. Nothing is discarded. */
export function switchVersion(record, versionId) {
  const base = normalizeVersions(record), latest = latestVersion(base);
  if (versionId === latest.id) {
    const { document, ...current } = latest;
    return { ...base, document, current, checkout: null, historyGroup: null };
  }
  const target = base.history.find(version => version.id === versionId);
  if (!target) throw new Error('找不到这个版本，可能已超出保留的 20 个版本。');
  const { document, ...current } = target;
  return { ...base, document, current, checkout: { latest, viewing: target.id }, historyGroup: null };
}

/** Every document still reachable, for keeping photo and attachment bytes. */
export function retainedDocuments(record) {
  const base = normalizeVersions(record);
  return [base.document, ...base.history.map(version => version.document), base.checkout?.latest.document].filter(Boolean);
}
