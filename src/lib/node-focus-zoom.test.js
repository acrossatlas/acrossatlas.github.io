import test from 'node:test';
import assert from 'node:assert/strict';
import { nodeFocusZoom } from './node-focus-zoom.js';
test('nearby Henningsvær pins get a street-level zoom instead of fitting the full drive', () => {
  const home = { id: 'home', coordinates: [14.206248, 68.15645] };
  const village = { id: 'village', coordinates: [14.207432, 68.156709] };
  const zoom = nodeFocusZoom(village, [home, village], 10);
  assert.ok(zoom > 16 && zoom < 19);
});
test('coincident visits cannot force infinite zoom', () => {
  const stop = { id: 'one', coordinates: [14, 68] };
  assert.equal(nodeFocusZoom(stop, [stop, { ...stop, id: 'two' }]), 15);
});
test('keeps user zoom and respects map maximum', () => {
  const stop = { id: 'one', coordinates: [14, 68] };
  assert.equal(nodeFocusZoom(stop, [stop], 18), 18);
  assert.equal(nodeFocusZoom(stop, [stop], 22, 20), 20);
});
