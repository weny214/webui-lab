const assert = require('node:assert/strict');
const fs = require('node:fs');
let chromium;
try { ({chromium} = require('playwright')); }
catch { console.error('This optional check needs Playwright. See docs/learning-log.md.'); process.exit(1); }

const tabs = ['dashboard', 'courses', 'todos', 'calendar', 'pomodoro'];
const email = 'a-very-long-student-account-for-layout-checks@example.invalid';

(async () => {
    const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH ||
        (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
    const browser = await chromium.launch({executablePath, headless: true});
    const errors = [];
    async function createPage(width, signedIn = true) {
        const page = await browser.newPage({viewport: {width, height: 900}});
        page.on('pageerror', error => errors.push(error.message));
        page.on('dialog', dialog => dialog.accept());
        // Auth is a deliberate fixture. All layout CSS comes from the actual app.
        await page.route('https://**/*', route => route.abort());
        await page.route('**/supabase.js', route => route.fulfill({
            contentType: 'application/javascript',
            body: `window.supabase = {createClient() {return {
                auth: {
                    onAuthStateChange(cb) {
                        window.__fixtureAuthChange = session => cb('TEST_SESSION', session);
                        setTimeout(() => cb('INITIAL_SESSION', ${signedIn ? JSON.stringify({user: {id: 'navigation-fixture', email}}) : 'null'}), 0);
                    },
                    async signInWithPassword({email}) {return {data: {session: {user: {id: 'navigation-fixture', email}}}, error: null};},
                    async signOut() {return {error: null};}
                },
                from() {return {select() {return {async order() {return {data: [], error: null};}};}};}
            };}};`
        }));
        await page.goto(process.env.STUDYHUB_TEST_URL || 'http://127.0.0.1:7777/', {waitUntil: 'networkidle'});
        await page.locator(signedIn ? '#account-panel' : '#auth-panel').waitFor({state: 'visible'});
        if (!signedIn) await page.waitForFunction(() => typeof window.__fixtureAuthChange === 'function');
        return page;
    }
    async function assertNoOverflow(page) {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
        const account = await page.locator('#account-toggle').boundingBox();
        if (account) assert.ok(account.x >= 0 && account.x + account.width <= page.viewportSize().width);
    }
    async function assertUnlocked(page) {
        assert.equal(await page.locator('#sidebar-backdrop').isVisible(), false);
        assert.equal(await page.evaluate(() => document.body.classList.contains('sidebar-modal-open')), false);
        assert.deepEqual(await page.evaluate(() => ['site-header', 'app-content', 'site-footer'].map(id => document.getElementById(id).inert)), [false, false, false]);
    }
    try {
        for (const width of [768, 1440]) {
            const page = await createPage(width);
            assert.equal(await page.locator('#sidebar').isVisible(), true);
            assert.equal(await page.locator('#sidebar-toggle').getAttribute('aria-expanded'), 'true');
            assert.equal(await page.locator('#sidebar [data-tab]').count(), 5);
            assert.equal(await page.locator('[id^="mob-"]').count(), 0);
            await assertUnlocked(page);
            const header = await page.locator('#site-header').boundingBox();
            const sidebar = await page.locator('#sidebar').boundingBox();
            const contentBefore = await page.locator('#app-content').boundingBox();
            assert.ok(sidebar.y >= header.y + header.height - 1);
            assert.ok(contentBefore.x >= sidebar.x + sidebar.width - 1);
            await page.locator('#sidebar-toggle').click();
            assert.equal(await page.locator('#sidebar').isVisible(), false);
            assert.equal(await page.locator('#sidebar-toggle').getAttribute('aria-expanded'), 'false');
            assert.ok((await page.locator('#app-content').boundingBox()).width > contentBefore.width);
            await page.locator('#sidebar-toggle').click();
            for (const tab of tabs) {
                await page.locator('#nav-' + tab).click();
                assert.equal(await page.locator('#tab-' + tab).isVisible(), true);
                assert.equal(await page.locator('#sidebar [aria-current="page"]').count(), 1);
                assert.equal(await page.locator('#nav-' + tab).getAttribute('aria-current'), 'page');
                for (const other of tabs.filter(value => value !== tab)) {
                    assert.equal(await page.locator('#tab-' + other).isVisible(), false);
                }
            }
            await assertNoOverflow(page);
            await page.locator('#account-toggle').click();
            assert.equal(await page.locator('#account-email').innerText(), email);
            assert.equal(await page.locator('#account-menu').isVisible(), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#account-menu').isVisible(), false);
            assert.equal(await page.locator('#account-toggle').evaluate(element => element === document.activeElement), true);
            await page.locator('#account-toggle').click();
            await page.locator('#main-content').click({position: {x: 10, y: 10}});
            assert.equal(await page.locator('#account-menu').isVisible(), false);
            await page.locator('#account-toggle').click();
            await page.locator('#logout-button').focus();
            await page.setViewportSize({width: 375, height: 900});
            await page.locator('#account-menu').waitFor({state: 'hidden'});
            assert.equal(await page.locator('#account-toggle').evaluate(element => element === document.activeElement), true);
            await page.setViewportSize({width, height: 900});
            await page.locator('#sidebar').waitFor({state: 'visible'});
            await page.close();
            console.log(`PASS: ${width}px desktop layout, collapse/expand, five views, active state, and account disclosure.`);
        }

        for (const width of [320, 375]) {
            const page = await createPage(width);
            assert.equal(await page.locator('#sidebar').isVisible(), false);
            await assertNoOverflow(page);
            await page.locator('#sidebar-toggle').click();
            assert.equal(await page.locator('#sidebar').getAttribute('role'), 'dialog');
            assert.equal(await page.locator('#sidebar').getAttribute('aria-modal'), 'true');
            assert.equal(await page.locator('#sidebar-backdrop').isVisible(), true);
            assert.deepEqual(await page.evaluate(() => ['site-header', 'app-content', 'site-footer'].map(id => document.getElementById(id).inert)), [true, true, true]);
            assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
            assert.equal(await page.locator('#sidebar-close').evaluate(element => element === document.activeElement), true);
            await page.keyboard.press('Shift+Tab');
            assert.equal(await page.locator('#nav-pomodoro').evaluate(element => element === document.activeElement), true);
            await page.keyboard.press('Tab');
            assert.equal(await page.locator('#sidebar-close').evaluate(element => element === document.activeElement), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#sidebar').isVisible(), false);
            assert.equal(await page.locator('#sidebar-toggle').evaluate(element => element === document.activeElement), true);
            await assertUnlocked(page);
            await page.locator('#sidebar-toggle').click();
            await page.mouse.click(width - 10, 200);
            assert.equal(await page.locator('#sidebar').isVisible(), false);
            await assertUnlocked(page);
            await page.locator('#sidebar-toggle').click();
            await page.locator('#sidebar-close').click();
            await assertUnlocked(page);
            for (const tab of tabs) {
                await page.locator('#sidebar-toggle').click();
                await page.locator('#nav-' + tab).click();
                assert.equal(await page.locator('#sidebar').isVisible(), false);
                assert.equal(await page.locator('#tab-' + tab).isVisible(), true);
                assert.equal(await page.locator('#nav-' + tab).getAttribute('aria-current'), 'page');
                assert.equal(await page.locator('#tab-' + tab).evaluate(element => element.contains(document.activeElement)), true);
                await assertUnlocked(page);
            }
            await page.locator('#account-toggle').click();
            const menu = await page.locator('#account-menu').boundingBox();
            assert.ok(menu.x >= 0 && menu.x + menu.width <= width);
            await page.locator('#logout-button').click();
            assert.equal(await page.locator('#auth-panel').isVisible(), true);
            assert.equal(await page.locator('#account-panel').isVisible(), false);
            assert.equal(await page.locator('#sidebar-toggle').isVisible(), false);
            await assertUnlocked(page);
            await page.close();
            console.log(`PASS: ${width}px mobile drawer, keyboard loop, three close paths, view focus, long email, and logout.`);
        }

        const page = await createPage(375);
        await page.locator('#sidebar-toggle').click();
        await page.setViewportSize({width: 768, height: 900});
        await page.waitForFunction(() => !document.body.classList.contains('sidebar-modal-open'));
        assert.equal(await page.locator('#sidebar').isVisible(), true);
        assert.equal(await page.locator('#sidebar').getAttribute('aria-modal'), null);
        await assertUnlocked(page);
        await page.setViewportSize({width: 375, height: 900});
        await page.locator('#sidebar').waitFor({state: 'hidden'});
        await assertUnlocked(page);
        await page.locator('#sidebar-toggle').click();
        await page.evaluate(() => window.__fixtureAuthChange(null));
        await page.locator('#auth-panel').waitFor({state: 'visible'});
        assert.equal(await page.locator('#sidebar').isVisible(), false);
        await assertUnlocked(page);
        await page.locator('#navbar-login').click();
        assert.equal(await page.locator('#auth-email').evaluate(element => element === document.activeElement), true);
        await page.locator('#auth-email').fill(email);
        await page.locator('#auth-password').fill('fixture-password');
        await page.locator('#auth-form button[value=login]').click();
        await page.locator('#account-panel').waitFor({state: 'visible'});
        assert.equal(await page.locator('#sidebar').isVisible(), false);
        await page.clock.install({time: new Date('2026-10-28T10:00:00Z')});
        await page.evaluate(() => {setTimerMode('focus'); toggleTimer();});
        await page.locator('#sidebar-toggle').click();
        await page.locator('#nav-todos').click();
        await page.clock.fastForward(1000);
        assert.deepEqual(await page.evaluate(() => [isRunning, timeLeft]), [true, 1499]);
        await page.evaluate(() => resetTimer());
        await page.close();
        console.log('PASS: breakpoint transitions, session expiry with open drawer, login focus, and timer preservation.');

        for (const width of [375, 1440]) {
            const loggedOut = await createPage(width, false);
            assert.equal(await loggedOut.locator('#sidebar').isVisible(), false);
            assert.equal(await loggedOut.locator('#sidebar-toggle').isVisible(), false);
            assert.equal(await loggedOut.locator('#account-panel').isVisible(), false);
            assert.equal(await loggedOut.locator('#navbar-login').isVisible(), true);
            await assertUnlocked(loggedOut);
            await assertNoOverflow(loggedOut);
            await loggedOut.close();
        }
        assert.deepEqual(errors, []);
        console.log('PASS: logged-out layouts and no uncaught application errors.');
        console.log('Scope: production navigation CSS at 320/375/768/1440px with mocked Supabase; no real Auth/RLS or full-app CDN/RWD claim.');
    } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
