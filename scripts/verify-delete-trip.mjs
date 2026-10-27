import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
await context.route('https://tiles.openfreemap.org/**', route => route.abort());
const page = await context.newPage(); page.setDefaultTimeout(10000);
const errors = []; page.on('pageerror', error => errors.push(error.message));
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
async function options() { await page.getByRole('button', { name: '更多', exact: true }).click(); }
async function confirmDelete() {
  await page.getByRole('button', { name: '删除行程', exact: true }).click();
  await page.getByRole('button', { name: '确认删除整趟行程', exact: true }).click();
  await page.waitForURL(`${base}/?log=trip`);
}
try {
  await page.goto(`${base}/?log=trip`);
  await page.getByRole('button', { name: '新建旅行', exact: true }).click();
  await page.getByLabel('名称', { exact: true }).fill('待删除的验证行程');
  await page.getByRole('button', { name: '创建', exact: true }).click();
  await options(); await page.getByRole('button', { name: '删除行程', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '删除行程', exact: true }).waitFor();
  await page.getByRole('button', { name: '关闭编辑窗口', exact: true }).click();
  const tripUrl = page.url();
  const fixture = await page.evaluate(async () => {
    const store = await import('/src/lib/notebook-store.js');
    const { createEmptyNotebook } = await import('/src/lib/notebook.js');
    const record = (await store.listNotebooks()).find(record => record.document?.title === '待删除的验证行程');
    const document = structuredClone(record.document);
    document.days[0].photos.push({ id: 'photo-to-delete', name: 'test.jpg', type: 'image/jpeg' });
    document.days[0].events.push({ id: 'booking-to-delete', title: '附件验证', type: '行程', attachments: [{ id: 'file-to-delete', name: 'test.pdf', type: 'application/pdf' }] });
    const saved = await store.writeNotebook(record.id, record.localRevision, document, 'fixture', [{ id: 'photo-to-delete', blob: new Blob(['image']) }, { id: 'file-to-delete', blob: new Blob(['pdf']) }]);
    const other = await store.openNotebook(createEmptyNotebook('保留的验证行程', document.startsOn, document.endsOn));
    other.document.days[0].photos.push({ id: 'kept-file', name: 'keep.jpg', type: 'image/jpeg' });
    await store.writeNotebook(other.id, other.localRevision, other.document, 'fixture', [{ id: 'kept-file', blob: new Blob(['keep']) }]);
    return { record: saved, otherId: other.id };
  });
  await page.reload();
  const otherPage = await context.newPage(); await otherPage.goto(tripUrl);
  await otherPage.getByRole('button', { name: '更多', exact: true }).waitFor();
  await options(); await confirmDelete(); await otherPage.waitForURL(`${base}/?log=trip`);
  await page.locator('.trip-card-list').getByRole('heading', { name: '保留的验证行程', exact: true }).waitFor();
  const stored = await page.evaluate(async ({ record, otherId }) => {
    const store = await import('/src/lib/notebook-store.js');
    const deleted = (await store.listNotebooks()).find(item => item.id === record.id);
    const result = { deleted: Boolean(deleted?.deletedAt), history: deleted.history.length,
      photo: Boolean(await store.readPhoto(record.id, 'photo-to-delete')), file: Boolean(await store.readPhoto(record.id, 'file-to-delete')), kept: Boolean(await store.readPhoto(otherId, 'kept-file')) };
    try { await store.openNotebook(record.document); result.reopened = true; } catch { result.reopened = false; }
    try { await store.writeNotebook(record.id, record.localRevision, record.document, 'stale'); result.overwritten = true; } catch { result.overwritten = false; }
    return result;
  }, fixture);
  assert.deepEqual(stored, { deleted: true, history: 0, photo: false, file: false, kept: true, reopened: false, overwritten: false });
  await page.goto(tripUrl); await page.waitForURL(`${base}/?log=trip`); await page.reload();
  assert.equal(await page.getByRole('heading', { name: '待删除的验证行程', exact: true }).count(), 0);
  console.log('PASS: cancel, deletion, asset cleanup, isolation, stale writes, cross-tab notification and reload.');
  const source = `${base}/trips/2026-netherlands-iceland-norway`;
  await page.goto(source); await options(); await confirmDelete(); await page.reload();
  await page.waitForFunction(() => document.querySelector('.summary-trip-count > strong')?.textContent === '2');
  assert.equal(await page.getByRole('heading', { name: 'Netherlands Iceland Norway', exact: true }).count(), 0);
  await page.goto(source); await page.waitForURL(`${base}/?log=trip`);
  await page.goto(`${base}/countries/netherlands`);
  await page.waitForFunction(() => !document.querySelector('[role="tablist"]'));
  await page.goto(`${base}/?log=map`);
  await page.waitForFunction(() => document.querySelectorAll('.country-card-grid .country-card').length === 2);
  assert.deepEqual(errors, []);
  console.log('PASS: deleted source trips stay deleted; summaries and country views update.');
} finally { await browser.close(); }
