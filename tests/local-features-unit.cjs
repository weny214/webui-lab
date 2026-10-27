const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// DOM/storage/clock doubles exercise local behavior, not browser layout or RLS.
function setup() {
  const elements = new Map();
  const alerts = [];
  const stored = new Map();
  const intervals = new Map();
  let storageFails = false;
  let now = Date.parse('2026-10-27T00:00:00Z');
  let intervalId = 0;
  class Element {
    constructor() {
      this.value = '';
      this.textContent = '';
      this.innerHTML = '';
      this.children = [];
      this.style = {};
      this.hidden = false;
      this.resetCount = 0;
      const classes = new Set(['hidden']);
      this.classList = {
        add: value => classes.add(value),
        remove: value => classes.delete(value),
        contains: value => classes.has(value)
      };
    }
    append(...nodes) { this.children.push(...nodes); }
    appendChild(node) { this.append(node); }
    replaceChildren(...nodes) { this.children = nodes; this.innerHTML = ''; this.textContent = ''; }
    reset() { this.resetCount++; this.onReset?.(); }
    addEventListener() {}
    focus() {}
  }
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  get('todo-form').onReset = () => {
    get('todo-text').value = '';
    get('todo-date').value = '';
  };
  get('event-form').onReset = () => {
    for (const field of ['title', 'date', 'time']) get('modal-event-' + field).value = '';
    get('modal-event-repeat').value = 'once';
  };
  const document = {
    getElementById: get,
    createElement: () => new Element(),
    querySelectorAll: () => []
  };
  const localStorage = {
    getItem: key => stored.get(key) ?? null,
    setItem(key, value) {
      if (storageFails) throw new Error('simulated quota failure');
      stored.set(key, value);
    }
  };
  class ClockDate extends Date { static now() { return now; } }
  const studyClient = {auth: {onAuthStateChange() {}}};
  const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8') + '\n' +
    fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
  const api = new Function('document', 'window', 'localStorage', 'Date', 'setInterval',
    'clearInterval', 'alert', 'studyClient', 'courseService', source + `
      return {loadLocalFeatures, saveData, addTodo, toggleTodo, deleteTodo,
        handleEventSubmit, openEventModalWithTime, renderDayTimeGridView,
        toggleTimer, resetTimer, setTimerMode, saveFocusProgress, applySession,
        setDate(value) {currentCalendarDate = new Date(value + 'T12:00:00');},
        state() {return {todos, calendarEvents, focusMinutesTotal, pendingFocusMinutes, timeLeft, isRunning};}};
    `)(document, {studyClient, scrollTo() {}}, localStorage, ClockDate,
      fn => { const id = ++intervalId; intervals.set(id, fn); return id; },
      id => intervals.delete(id), message => alerts.push(message), studyClient,
      {list: async () => []});
  api.loadLocalFeatures('A');
  return {
    api, get, alerts, stored,
    failStorage(value) { storageFails = value; },
    advance(ms) { now += ms; for (const callback of [...intervals.values()]) callback(); },
    submitTodo(text = '今天的作業', date = '2026-10-27') {
      get('todo-text').value = text;
      get('todo-date').value = date;
      api.addTodo({preventDefault() {}});
    },
    prepareEvent(type = 'event', repeat = 'once') {
      api.openEventModalWithTime('2026-10-27', '10:00');
      get('modal-event-title').value = '保留這筆行程';
      get('modal-event-type').value = type;
      get('modal-event-repeat').value = repeat;
    },
    submitEvent() { api.handleEventSubmit({preventDefault() {}}); },
    renderDay(date) {
      api.setDate(date);
      const container = new Element();
      api.renderDayTimeGridView(new Element(), container);
      return container;
    }
  };
}

test('failed todo creation preserves input and committed state; retry creates one item', () => {
  const h = setup();
  h.failStorage(true);
  h.submitTodo();
  assert.equal(h.get('todo-text').value, '今天的作業');
  assert.equal(h.get('todo-form').resetCount, 0);
  assert.equal(h.api.state().todos.length, 0);
  assert.equal(h.stored.size, 0);
  h.failStorage(false);
  h.submitTodo();
  assert.equal(h.api.state().todos.length, 1);
  assert.equal(JSON.parse(h.stored.get('studyhub_local_A')).todos.length, 1);
  assert.equal(h.get('todo-text').value, '');
});

test('whitespace-only todos are rejected without storage changes', () => {
  const h = setup();
  h.submitTodo('   ');
  assert.equal(h.api.state().todos.length, 0);
  assert.equal(h.stored.size, 0);
  assert.equal(h.get('todo-form').resetCount, 0);
});

test('failed completion and deletion retain the previously saved todo', () => {
  const h = setup();
  h.submitTodo();
  const id = h.api.state().todos[0].id;
  const saved = h.stored.get('studyhub_local_A');
  const markup = h.get('todo-list-container').innerHTML;
  h.failStorage(true);
  h.api.toggleTodo(id);
  assert.equal(h.api.state().todos[0].completed, false);
  assert.equal(h.get('todo-list-container').innerHTML, markup);
  h.api.deleteTodo(id);
  assert.equal(h.api.state().todos.length, 1);
  assert.equal(h.stored.get('studyhub_local_A'), saved);
  h.failStorage(false);
  h.api.toggleTodo(id);
  assert.equal(h.api.state().todos[0].completed, true);
  h.api.deleteTodo(id);
  assert.equal(h.api.state().todos.length, 0);
});

for (const type of ['task', 'event', 'course']) {
  test(`failed ${type} submission keeps the modal open and retry saves exactly once`, () => {
    const h = setup();
    h.prepareEvent(type);
    h.failStorage(true);
    h.submitEvent();
    assert.equal(h.get('event-modal').classList.contains('hidden'), false);
    assert.equal(h.get('modal-event-title').value, '保留這筆行程');
    assert.equal(h.api.state().todos.length + h.api.state().calendarEvents.length, 0);
    assert.equal(h.alerts.length, 1);
    assert.match(h.alerts[0], /儲存失敗/);
    h.failStorage(false);
    h.submitEvent();
    const data = JSON.parse(h.stored.get('studyhub_local_A'));
    assert.equal(data.todos.length, type === 'task' ? 1 : 0);
    assert.equal(data.calendarEvents.length, type === 'task' ? 0 : 1);
    assert.equal(h.get('event-modal').classList.contains('hidden'), true);
    assert.equal(h.get('modal-event-title').value, '');
  });
}

test('unsupported recurrence is rejected for every event type; legacy data stays intact', () => {
  const h = setup();
  const legacy = {id: 1, title: '舊行程', date: '2026-10-27', time: '10:00', repeat: 'daily'};
  h.api.saveData({calendarEvents: [legacy]});
  for (const type of ['task', 'event', 'course']) {
    for (const repeat of ['daily', 'weekly']) {
      h.prepareEvent(type, repeat);
      h.submitEvent();
      assert.equal(h.get('event-modal').classList.contains('hidden'), false);
      assert.match(h.alerts.at(-1), /尚未支援/);
    }
  }
  assert.deepEqual(h.api.state().calendarEvents, [legacy]);
  assert.equal(h.api.state().todos.length, 0);
});

test('day view shows only that day’s todos with text nodes, time and completion state', () => {
  const h = setup();
  h.api.saveData({todos: [
    {id: 1, text: '<img src=x onerror=alert(1)>', date: '2026-10-27', time: '09:30', completed: true},
    {id: 2, text: '明天的作業', date: '2026-10-28', completed: false}
  ]});
  const section = h.renderDay('2026-10-27').children[0];
  assert.equal(section.children[0].textContent, '當日待辦');
  assert.equal(section.children.length, 2);
  assert.equal(section.children[1].textContent, '✓ 09:30 <img src=x onerror=alert(1)>');
  assert.match(section.children[1].className, /line-through/);
  assert.equal(section.children[1].innerHTML, '');
  assert.equal(h.renderDay('2026-10-29').children[0].children[1].textContent, '當日沒有待辦事項。');
});

test('focus completes at its deadline despite delayed callbacks and credits only once', () => {
  const h = setup();
  h.api.toggleTimer();
  h.advance(1499_000);
  assert.equal(h.api.state().timeLeft, 1);
  assert.equal(h.api.state().focusMinutesTotal, 0);
  h.advance(1000);
  assert.equal(h.get('timer-display').textContent, '00:00');
  assert.equal(h.api.state().focusMinutesTotal, 25);
  assert.equal(h.api.state().isRunning, false);
  h.advance(60_000);
  assert.equal(h.api.state().focusMinutesTotal, 25);
  h.api.toggleTimer();
  assert.equal(h.api.state().timeLeft, 1500);
  assert.equal(h.api.state().focusMinutesTotal, 25);
});

test('pause preserves fractional remaining time and excludes the paused duration', () => {
  const h = setup();
  h.api.toggleTimer();
  h.advance(3250);
  h.api.toggleTimer();
  h.advance(120_000);
  assert.equal(h.api.state().timeLeft, 1497);
  h.api.toggleTimer();
  h.advance(1496_000);
  assert.equal(h.api.state().timeLeft, 1);
  assert.equal(h.api.state().focusMinutesTotal, 0);
  h.advance(750);
  assert.equal(h.api.state().focusMinutesTotal, 25);
});

test('reset cancels the active timer; breaks never credit focus minutes', () => {
  const h = setup();
  h.api.toggleTimer();
  h.advance(1000);
  h.api.resetTimer();
  h.advance(1500_000);
  assert.equal(h.api.state().timeLeft, 1500);
  assert.equal(h.api.state().focusMinutesTotal, 0);
  h.api.setTimerMode('break');
  assert.equal(h.get('timer-toggle-btn').textContent, '開始休息');
  h.api.toggleTimer();
  h.advance(300_000);
  assert.equal(h.api.state().timeLeft, 0);
  assert.equal(h.api.state().focusMinutesTotal, 0);
});

test('unsaved focus progress remains retryable without duplicate credit', () => {
  const h = setup();
  h.failStorage(true);
  h.api.toggleTimer();
  h.advance(1500_000);
  assert.equal(h.api.state().focusMinutesTotal, 0);
  assert.equal(h.api.state().pendingFocusMinutes, 25);
  assert.equal(h.get('timer-save-retry').hidden, false);
  assert.match(h.get('timer-save-status').textContent, /尚未儲存/);
  assert.equal(h.alerts.length, 1);
  assert.equal(h.api.saveFocusProgress(), false);
  h.failStorage(false);
  assert.equal(h.api.saveFocusProgress(), true);
  assert.equal(h.api.saveFocusProgress(), true);
  assert.equal(h.api.state().focusMinutesTotal, 25);
  assert.equal(h.api.state().pendingFocusMinutes, 0);
  assert.equal(h.get('timer-save-retry').hidden, true);
  assert.equal(JSON.parse(h.stored.get('studyhub_local_A')).focusMinutesTotal, 25);
});

test('logout cancels the timer and does not carry pending minutes to another account', async () => {
  const h = setup();
  await h.api.applySession({user: {id: 'A'}});
  h.failStorage(true);
  h.api.toggleTimer();
  h.advance(1500_000);
  assert.equal(h.api.state().pendingFocusMinutes, 25);
  h.api.toggleTimer();
  await h.api.applySession(null);
  h.failStorage(false);
  await h.api.applySession({user: {id: 'B'}});
  h.advance(1500_000);
  assert.equal(h.api.state().isRunning, false);
  assert.equal(h.api.state().focusMinutesTotal, 0);
  assert.equal(h.api.state().pendingFocusMinutes, 0);
  assert.equal(h.get('timer-save-retry').hidden, true);
  assert.equal(h.api.saveFocusProgress(), true);
  assert.equal(h.stored.has('studyhub_local_B'), false);
});
