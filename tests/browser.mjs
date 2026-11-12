import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || new URL('../package.json', import.meta.url));
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--no-sandbox'] });
const baseURL = process.env.BOARD_URL || 'http://127.0.0.1:4173';
const incident = (id, openedAt, summary = 'Calendar sync delayed') => ({
  id, openedAt, summary, service: 'calendar-sync', region: 'eu-west', severity: 'sev2',
});
const original = incident('INC-1', '2026-11-11T23:11:00.000Z');
const arrival = incident('INC-2', '2026-11-12T00:12:00.000Z', '<img src=x onerror=alert(1)>');
const results = [];
try {
  for (const [locale, timezoneId, expectedTime] of [
    ['en-GB', 'Europe/Berlin', '00:11:00'],
    ['en-NZ', 'Pacific/Auckland', '12:11:00'],
  ]) {
    const context = await browser.newContext({ locale, timezoneId });
    const page = await context.newPage();
    let calls = 0;
    let ackRequest;
    let failedAck = false;
    await page.route('**/api/incidents?*', async (route) => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, calls === 1 ? 500 : 30));
      await route.fulfill({ json: { updatedAt: '2026-11-12T01:00:00Z', incidents: calls === 1 ? [original] : [original, arrival], cursor: `cursor-${calls}` } });
    });
    await page.route('**/api/ack?*', async (route) => {
      ackRequest = new URL(route.request().url());
      if (!failedAck) {
        failedAck = true;
        await route.fulfill({ status: 503, body: 'Temporary failure' });
      } else {
        await route.fulfill({ json: { id: ackRequest.searchParams.get('id'), ackedAt: '2026-11-12T01:01:00Z', receipt: 'test-only' } });
      }
    });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.getByTestId('loader').isVisible(), true);
    await page.getByTestId('incident-row').first().waitFor();
    assert.equal(await page.getByTestId('loader').isVisible(), false);
    assert.match(await page.locator('time').first().innerText(), /12\/11\/2026/);
    assert.match(await page.locator('time').first().innerText(), new RegExp(expectedTime));
    assert.equal(await page.locator('time').first().getAttribute('datetime'), original.openedAt);
    await page.getByTestId('incident-row').filter({ hasText: arrival.id }).waitFor();
    assert.equal(await page.getByTestId('incident-row').first().getAttribute('data-id'), arrival.id);
    assert.equal(await page.locator('img').count(), 0, 'API text must not become HTML');
    const row = page.locator('[data-id="INC-1"]');
    await row.getByTestId('ack').click();
    await page.getByTestId('error').waitFor();
    assert.equal(await row.getByTestId('acked').count(), 0, 'failure cannot mark acknowledged');
    await row.getByTestId('ack').click();
    await row.getByTestId('acked').waitFor();
    assert.equal(ackRequest.searchParams.get('id'), original.id);
    assert.match(ackRequest.searchParams.get('cursor'), /^cursor-[2-9]/);
    assert.equal(await row.getByTestId('ack').isDisabled(), true);
    await page.waitForTimeout(2100);
    assert.equal(await row.getByTestId('acked').count(), 1, 'ack survives refresh');
    results.push({ locale, timezoneId, calls, checks: ['loader', 'local-time', 'UTC-attribute', 'live-newest-first', 'safe-text', 'ack-error-retry', 'id-and-cursor', 'ack-survives-refresh'] });
    await context.close();
  }

  const page = await browser.newPage();
  let calls = 0;
  await page.route('**/api/incidents?*', async (route) => {
    calls++;
    if (calls === 1) return route.fulfill({ status: 503, body: 'unavailable' });
    await route.fulfill({ json: { updatedAt: '2026-11-12T01:00:00Z', incidents: [], cursor: 'empty' } });
  });
  await page.goto(baseURL);
  await page.getByTestId('error').waitFor();
  await page.getByTestId('empty').waitFor();
  assert.equal(await page.getByTestId('loader').isVisible(), false);
  results.push({ checks: ['initial-error', 'automatic-recovery', 'empty-state'] });
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}
