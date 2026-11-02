import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1599, height: 828 } });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = []; page.on('pageerror', error => errors.push(error.message));
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const output = process.env.VERIFY_OUTPUT || '/tmp/across-notebook-review';
await mkdir(output, { recursive: true });
const map = () => page.locator('[data-map-kind="transfer"]');
async function done() {
  await page.getByRole('dialog').getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
}
try {
  await page.goto(`${base}/trips/2026-netherlands-iceland-norway?date=2026-09-24`);
  await page.waitForFunction(() => document.querySelector('[data-map-countries="CN,NL"]'));
  assert.equal(await map().locator('.template-country-label').count(), 0, 'country overview has no floating country cards');
  assert.equal(await map().locator('.daily-map__marker').count(), 0, 'country overview must not become airport pins');
  await page.locator('.itinerary-title-button').first().click();
  await page.getByLabel('目的地', { exact: true }).last().fill('OSL');
  await done();
  await page.waitForFunction(() => document.querySelector('[data-map-countries="CN,NO"]'));
  assert.equal(await map().locator('.template-country-label').count(), 0);
  assert.equal(await page.getByRole('button', { name: '编辑行程：HKG - OSL', exact: true }).count(), 1);
  await page.getByRole('button', { name: '恢复全天总览', exact: true }).click();
  await page.screenshot({ path: `${output}/transfer-template-linked.png` });
  await page.getByRole('button', { name: '编辑行程：HKG - OSL', exact: true }).click();
  const remove = await page.getByRole('button', { name: '删除', exact: true }).boundingBox();
  const complete = await page.getByRole('button', { name: '完成', exact: true }).boundingBox();
  assert.ok(remove.x > 700 && complete.x > remove.x, 'delete and done remain adjacent on the right');
  await page.getByLabel('目的地', { exact: true }).last().fill('AMS'); await done();
  await page.waitForFunction(() => document.querySelector('[data-map-countries="CN,NL"]'));
  assert.deepEqual(errors, []);
  console.log('PASS: country outlines survive editing without floating cards; endpoints update countries; delete stays right.');
} catch (error) { await page.screenshot({ path: `${output}/map-failure.png` }).catch(() => {}); throw error; }
finally { await browser.close(); }
