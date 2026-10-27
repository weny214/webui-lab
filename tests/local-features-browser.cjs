const assert = require('node:assert/strict');
const fs = require('node:fs');
let chromium;
try {
  ({chromium} = require('playwright'));
} catch {
  console.error('This optional check needs Playwright. See docs/learning-log.md for setup.');
  process.exit(1);
}

(async () => {
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH ||
    (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({executablePath, headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    const errors = [];
    const dialogs = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
    // Deliberately isolate local UI behavior. No real login, CDN or database calls.
    await page.route('https://**/*', route => route.abort());
    await page.route('**/supabase.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: `window.supabase = {createClient() {return {
        auth: {
          onAuthStateChange(cb) {setTimeout(() => cb('INITIAL_SESSION', {user: {id: 'browser-fixture', email: 'fixture@example.invalid'}}), 0);},
          async signOut() {return {};}
        },
        from() {return {select() {return {async order() {return {data: [], error: null};}};}};}
      };}};`
    }));
    await page.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (window.__failLocalStorage) throw new DOMException('test quota failure', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    });
    await page.goto(process.env.STUDYHUB_TEST_URL || 'http://127.0.0.1:7777/', {waitUntil: 'networkidle'});
    // Only visibility utility behavior is supplied; this is not a Tailwind/RWD test.
    await page.addStyleTag({content: '.hidden {display:none !important;}'});
    await page.locator('#account-panel').waitFor({state: 'visible'});
    await page.evaluate(() => switchTab('todos'));
    await page.locator('#todo-text').fill('browser task');
    await page.locator('#todo-date').fill('2026-10-27');
    await page.evaluate(() => {window.__failLocalStorage = true;});
    await page.getByRole('button', {name: '新增任務', exact: true}).click();
    assert.equal(await page.locator('#todo-text').inputValue(), 'browser task');
    assert.equal(await page.evaluate(() => todos.length), 0);
    await page.evaluate(() => {window.__failLocalStorage = false;});
    await page.getByRole('button', {name: '新增任務', exact: true}).click();
    assert.equal(await page.locator('#todo-text').inputValue(), '');
    assert.equal(await page.evaluate(() => todos.length), 1);
    await page.evaluate(() => {window.__failLocalStorage = true;});
    await page.locator('#todo-list-container input[type=checkbox]').click();
    assert.equal(await page.locator('#todo-list-container input[type=checkbox]').isChecked(), false);
    console.log('PASS: real todo form preserves failed input, resets after success, and reverts a failed checkbox toggle.');

    await page.evaluate(() => {
      currentCalendarDate = new Date('2026-10-27T12:00:00');
      switchTab('calendar');
      setCalendarView('day');
      openEventModalWithTime('2026-10-27', '10:00');
    });
    await page.locator('#modal-event-title').fill('<img src=x onerror=alert(1)>');
    await page.locator('#modal-event-type').selectOption('task');
    await page.getByRole('button', {name: '儲存行程', exact: true}).click();
    assert.equal(await page.locator('#event-modal').isVisible(), true);
    assert.equal(await page.locator('#modal-event-title').inputValue(), '<img src=x onerror=alert(1)>');
    await page.evaluate(() => {window.__failLocalStorage = false;});
    await page.getByRole('button', {name: '儲存行程', exact: true}).click();
    assert.equal(await page.locator('#event-modal').isVisible(), false);
    assert.equal(await page.locator('#modal-event-title').inputValue(), '');
    assert.match(await page.locator('#calendar-view-container').innerText(), /browser task/);
    assert.match(await page.locator('#calendar-view-container').innerText(), /<img src=x onerror=alert\(1\)>/);
    assert.equal(await page.locator('#calendar-view-container img').count(), 0);
    assert.equal(await page.locator('#modal-event-repeat option[value=daily]').isDisabled(), true);
    assert.equal(await page.locator('#modal-event-repeat option[value=weekly]').isDisabled(), true);
    const before = await page.evaluate(() => todos.length + calendarEvents.length);
    await page.evaluate(() => {
      openEventModalWithTime('2026-10-27', '10:00');
      document.getElementById('modal-event-title').value = 'unsupported repeat';
      document.getElementById('modal-event-repeat').value = 'daily';
      handleEventSubmit({preventDefault() {}});
    });
    assert.equal(await page.evaluate(() => todos.length + calendarEvents.length), before);
    await page.evaluate(() => closeEventModal());
    console.log('PASS: actual modal retry saves once, day view renders todos as text, and recurrence is disabled and guarded.');

    await page.clock.install({time: new Date('2026-10-27T10:00:00Z')});
    await page.evaluate(() => {
      switchTab('pomodoro');
      setTimerMode('focus');
      window.__failLocalStorage = true;
    });
    await page.locator('#timer-toggle-btn').click();
    await page.clock.fastForward(1500_000);
    assert.equal(await page.locator('#timer-display').innerText(), '00:00');
    assert.equal(await page.locator('#timer-save-retry').isVisible(), true);
    assert.deepEqual(await page.evaluate(() => [focusMinutesTotal, pendingFocusMinutes]), [0, 25]);
    await page.evaluate(() => {window.__failLocalStorage = false;});
    await page.locator('#timer-save-retry').click();
    assert.deepEqual(await page.evaluate(() => [focusMinutesTotal, pendingFocusMinutes]), [25, 0]);
    assert.equal(await page.locator('#timer-save-retry').isVisible(), false);
    await page.clock.fastForward(60_000);
    assert.equal(await page.evaluate(() => focusMinutesTotal), 25);
    await page.locator('#logout-button').click();
    assert.equal(await page.locator('#auth-panel').isVisible(), true);
    assert.equal(await page.locator('main').isVisible(), false);
    assert.deepEqual(errors, []);
    assert.equal(dialogs.some(message => message.includes('unsupported repeat')), false);
    console.log('PASS: deadline completion, visible retry control, one-time persisted credit, and logout in Chromium.');
    console.log('Scope: local browser interactions with mocked Supabase and visibility-only CSS; no real Auth, RLS, CDN, or RWD claim.');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
