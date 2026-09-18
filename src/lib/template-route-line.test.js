import test from 'node:test';
import assert from 'node:assert/strict';
import { templateRouteLine } from './template-route-line.js';
const from = [0,0], to = [1,1];
const geometry = { type: 'LineString', coordinates: [from,[0,1],to] };
test('ground transport preserves routed geometry and uses solid lines', () => {
  for (const mode of ['驾车','徒步','公交','铁路']) assert.deepEqual(templateRouteLine({mode,geometry,from,to}), {coordinates:geometry.coordinates});
});
test('ground routes without geometry are omitted, never replaced by straight lines', () => {
  assert.equal(templateRouteLine({mode:'驾车',from,to}),null);
});
test('air and sea use only endpoints with a dashed line, ignoring land geometry', () => {
  for(const mode of ['flight','ferry','航班','海运']) assert.deepEqual(templateRouteLine({mode,geometry,from,to}),{coordinates:[from,to],dashArray:[3,3]});
});
