import test from 'node:test';
import assert from 'node:assert/strict';
import { listVersions, normalizeVersions, recordChange, retainedDocuments, switchVersion } from './notebook-versions.js';

const doc = title => ({ id: 'trip', title });
const fresh = () => normalizeVersions({ id: 'trip', document: doc('v0'), history: [], localRevision: 0 });

test('legacy history is relabelled so each version names the change that produced it', () => {
  const legacy = { id: 'trip', document: doc('v2'), history: [
    { document: doc('v0'), label: '修改 A', at: '2026-10-01T10:00:00Z' },
    { document: doc('v1'), label: '应用 AI 修改', at: '2026-10-02T10:00:00Z' },
  ] };
  const versions = listVersions(legacy);
  assert.deepEqual(versions.map(version => [version.document.title, version.label, version.source]), [
    ['v2', '应用 AI 修改', 'ai'], ['v1', '修改 A', 'human'], ['v0', '初始版本', 'seed'],
  ]);
  assert.equal(versions[0].isLatest && versions[0].isViewing, true);
});

test('changes add versions newest first with their source', () => {
  let record = recordChange(fresh(), doc('v1'), { label: '修改 A' });
  record = recordChange(record, doc('v2'), { label: '应用 AI 修改', source: 'ai' });
  assert.deepEqual(listVersions(record).map(version => [version.document.title, version.source]), [['v2', 'ai'], ['v1', 'human'], ['v0', 'seed']]);
});

test('switching to an older version keeps the latest and can switch straight back', () => {
  let record = recordChange(recordChange(fresh(), doc('v1'), { label: 'A' }), doc('v2'), { label: 'B' });
  const [latest, , first] = listVersions(record);
  record = switchVersion(record, first.id);
  assert.equal(record.document.title, 'v0');
  const viewing = listVersions(record);
  assert.equal(viewing.find(version => version.isViewing).id, first.id);
  assert.equal(viewing[0].id, latest.id);
  assert.equal(viewing.length, 3, 'switching does not add versions');
  assert.ok(retainedDocuments(record).some(book => book.title === 'v2'), 'latest stays retained for its photos');
  record = switchVersion(record, latest.id);
  assert.equal(record.document.title, 'v2');
  assert.equal(record.checkout, null);
});

test('editing while an older version is open keeps the previous latest as a version', () => {
  let record = recordChange(fresh(), doc('v1'), { label: 'A' });
  record = switchVersion(record, listVersions(record)[1].id);
  record = recordChange(record, doc('v0-edited'), { label: 'C' });
  assert.deepEqual(listVersions(record).map(version => version.document.title), ['v0-edited', 'v1', 'v0']);
  assert.equal(record.checkout, null);
});

test('grouped edits update one version', () => {
  let record = recordChange(fresh(), doc('v1'), { label: 'A', groupId: 'g' });
  record = recordChange(record, doc('v1b'), { label: 'A', groupId: 'g' });
  assert.equal(listVersions(record).length, 2);
});
