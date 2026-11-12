import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Unlike a locator click, this keeps the coordinates chosen BEFORE an arrival.
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || new URL('../package.json', import.meta.url));
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const incident = (id, openedAt) => ({ id, openedAt, service: 'calendar-sync', region: 'eu-west', summary: 'Sync delayed', severity: 'sev2' });
  const intended = incident('INC-intended', '2026-11-12T00:00:00Z');
  const arriving = incident('INC-arriving', '2026-11-12T00:01:00Z');
  let calls = 0;
  let ackedId;
  await page.route('**/api/incidents?*', async (route) => {
    calls++;
    await route.fulfill({ json: { updatedAt: '2026-11-12T00:02:00Z', incidents: calls === 1 ? [intended] : [arriving, intended], cursor: `pointer-${calls}` } });
  });
  await page.route('**/api/ack?*', async (route) => {
    ackedId = new URL(route.request().url()).searchParams.get('id');
    await route.fulfill({ json: { id: ackedId, ackedAt: '2026-11-12T00:03:00Z', receipt: 'test-only' } });
  });
  await page.goto(process.env.BOARD_URL || 'http://127.0.0.1:4173');
  const button = page.locator('[data-id="INC-intended"]').getByTestId('ack');
  await button.waitFor();
  const box = await button.boundingBox();
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(2500);
  assert.ok(calls >= 2, 'An arrival must have been fetched before the click');
  await page.mouse.click(point.x, point.y);
  await page.getByTestId('acked').waitFor();
  assert.equal(ackedId, intended.id, 'An incoming incident must not replace the operator’s pointer target');
  console.log(JSON.stringify({ passed: true, calls, intended: intended.id, got: ackedId, point }));
} finally {
  await browser.close();
}
