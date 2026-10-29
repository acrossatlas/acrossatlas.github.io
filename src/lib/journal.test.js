import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTemplate, composePageFrames, createFrame, createJournal, createSpread, fitFrame, JOURNAL_SPREADS, JOURNAL_TEMPLATES, packPrintSheets, photoCrop, printItems } from './journal.js';
import { buildJournalPdf } from './journal-print.js';

test('templates and spread photos stay inside their physical notebook bounds', () => {
  const pages = [...JOURNAL_TEMPLATES.map(template => applyTemplate({ frames: [] }, template.id)), ...JOURNAL_SPREADS.flatMap(template => createSpread(template.id))];
  for (const page of pages) for (const frame of page.frames) {
    assert.ok(frame.x >= -.1 && frame.y >= -.1);
    assert.ok(frame.x + frame.width <= (frame.span ? 220 : 110) + .1);
    assert.ok(frame.y + frame.height <= 210.1);
  }
  const rotated = fitFrame(createFrame({ x: -50, y: 200, width: 90, height: 190, rotation: 35 }));
  const angle = rotated.rotation * Math.PI / 180;
  const width = Math.abs(rotated.width * Math.cos(angle)) + Math.abs(rotated.height * Math.sin(angle));
  const height = Math.abs(rotated.width * Math.sin(angle)) + Math.abs(rotated.height * Math.cos(angle));
  assert.ok(rotated.x + rotated.width / 2 - width / 2 >= -.1);
  assert.ok(rotated.y + rotated.height / 2 + height / 2 <= 210.1);
});

test('A4 packing preserves every exact photo size and reserves room for crop marks and labels', () => {
  const project = createJournal('test');
  project.pages = JOURNAL_SPREADS.flatMap(spread => createSpread(spread.id));
  project.pages.push(...JOURNAL_TEMPLATES.map(template => applyTemplate({ frames: [] }, template.id)));
  const input = printItems(project);
  const sheets = packPrintSheets(input);
  const output = sheets.flatMap(sheet => sheet.items);
  assert.equal(output.length, input.length);
  assert.equal(new Set(output.map(item => item.id)).size, input.length);
  for (const sheet of sheets) for (const item of sheet.items) {
    const original = input.find(frame => frame.id === item.id);
    assert.equal(item.width, original.width);
    assert.equal(item.height, original.height);
    assert.ok(item.printX >= 10 && item.printX + item.width <= 200.01);
    assert.ok(item.printY >= 18 && item.printY + item.height <= 278.01);
    for (const other of sheet.items) {
      if (item === other) continue;
      assert.ok(item.printX + item.width + 7.99 <= other.printX || other.printX + other.width + 7.99 <= item.printX || item.printY + item.height + 10.99 <= other.printY || other.printY + other.height + 10.99 <= item.printY, `${item.number} overlaps ${other.number}`);
    }
  }
  assert.deepEqual(packPrintSheets([]), []);
});

test('a cross-gutter photo prints once and has continuous page crops', () => {
  const project = { assets: [], pages: createSpread('panorama') };
  assert.equal(printItems(project).length, 1);
  const [left] = composePageFrames(project, 0);
  const [right] = composePageFrames(project, 1);
  assert.equal(left.id, right.id);
  assert.equal(left.x - right.x, 110);
  assert.equal(left.width, 164);
  assert.equal(right.width, 164);
});

test('crop coordinates stay within the source and match the target aspect ratio', () => {
  for (const asset of [{ width: 2400, height: 1600 }, { width: 1000, height: 2000 }]) {
    for (const zoom of [1, 1.7, 4]) for (const offsetX of [-1, 0, 1]) for (const offsetY of [-1, 1]) {
      const frame = { width: 43, height: 57, zoom, offsetX, offsetY };
      const crop = photoCrop(asset, frame);
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.width <= asset.width + .001 && crop.y + crop.height <= asset.height + .001);
      assert.ok(Math.abs(crop.width / crop.height - 43 / 57) < 1e-9);
    }
  }
});

test('changing a template retains assigned photos in order and leaves the source page intact', () => {
  const original = applyTemplate({ frames: [] }, 'contact');
  original.frames[0].assetId = 'one';
  original.frames[2].assetId = 'two';
  const next = applyTemplate(original, 'duo');
  assert.deepEqual(next.frames.map(frame => frame.assetId), ['one', 'two']);
  assert.equal(original.frames.length, 6);
  assert.notEqual(next.frames[0].id, original.frames[0].id);
});

test('the photo PDF uses A4 at actual size and exports the expected sheet count', async () => {
  const project = createJournal('test');
  project.pages = createSpread('panorama');
  const pdf = await buildJournalPdf(project);
  assert.equal(pdf.getNumberOfPages(), packPrintSheets(printItems(project)).length);
  assert.ok(Math.abs(pdf.internal.pageSize.getWidth() - 210) < .01);
  assert.ok(Math.abs(pdf.internal.pageSize.getHeight() - 297) < .01);
  const output = pdf.output();
  assert.match(output, /\/PrintScaling \/None/);
  assert.ok(output.startsWith('%PDF-'));
});
