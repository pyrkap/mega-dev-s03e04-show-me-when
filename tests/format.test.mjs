import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocalTime, newestFirst } from '../app/format.js';

test('Berlin and Auckland show the same instant in different local zones', () => {
  const value = '2026-11-11T23:11:00.000Z';
  const berlin = formatLocalTime(value, 'en-GB', { timeZone: 'Europe/Berlin' });
  const auckland = formatLocalTime(value, 'en-NZ', { timeZone: 'Pacific/Auckland' });
  assert.match(berlin, /12\/11\/2026/);
  assert.match(berlin, /00:11:00/);
  assert.match(auckland, /12\/11\/2026/);
  assert.match(auckland, /12:11:00/);
  assert.notEqual(berlin, auckland);
});

test('EU day precedes month and UTC remains an input, not the label', () => {
  assert.match(formatLocalTime('2026-03-26T12:00:00Z', 'en-GB', { timeZone: 'Europe/Berlin' }), /26\/03\/2026/);
  assert.equal(formatLocalTime('invalid'), 'Unknown time');
});

test('sorting puts newer arrivals first without mutating API data', () => {
  const original = [{ id: 'old', openedAt: '2026-11-11T03:00:00Z' }, { id: 'new', openedAt: '2026-11-12T03:00:00Z' }];
  assert.deepEqual(newestFirst(original).map((row) => row.id), ['new', 'old']);
  assert.equal(original[0].id, 'old');
});
