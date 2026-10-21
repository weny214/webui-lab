// Data States & LocalStorage
let courses = JSON.parse(localStorage.getItem('studyhub_courses')) || [
    { id: 1, name: '深度學習與電腦視覺', color: '#8D7B68' },
    { id: 2, name: '區塊鏈技術原理', color: '#BC6C25' }
];

let todos = JSON.parse(localStorage.getItem('studyhub_todos')) || [
    { id: 1, text: '完成 Homework 5 專案部署', date: '2026-10-19', completed: false },
    { id: 2, text: '準備微電腦系統實驗報告', date: '2026-10-22', completed: true }
];

// 新增：行事曆專屬行程（支援時間與重複設定）
let calendarEvents = JSON.parse(localStorage.getItem('studyhub_calendar_events')) || [
    { id: 1, title: '深度學習課堂專題', date: '2026-10-21', time: '14:00', type: 'course', repeat: 'weekly' },
    { id: 2, title: '小組程式碼檢討', date: '2026-10-21', time: '10:00', type: 'event', repeat: 'once' }
];

let focusMinutesTotal = parseInt(localStorage.getItem('studyhub_focus_time')) || 0;

// Save data helper
function saveData() {
    localStorage.setItem('studyhub_courses', JSON.stringify(courses));
    localStorage.setItem('studyhub_todos', JSON.stringify(todos));
    localStorage.setItem('studyhub_calendar_events', JSON.stringify(calendarEvents));
    localStorage.setItem('studyhub_focus_time', focusMinutesTotal);
    updateDashboard();
    
    const calendarTab = document.getElementById('tab-calendar');
    if(calendarTab && !calendarTab.classList.contains('hidden')) {
        renderCalendar();
    }
}

// Tab Switching Logic
function switchTab(tabId) {
    const tabs = ['dashboard', 'courses', 'todos', 'calendar', 'pomodoro'];
    tabs.forEach(t => {
        const tabEl = document.getElementById(`tab-${t}`);
        if(tabEl) tabEl.classList.add('hidden');
        
        const navBtn = document.getElementById(`nav-${t}`);
        if(navBtn) {
            navBtn.className = "px-4 py-2 rounded-lg font-medium text-sm transition text-[#4A3B32] hover:bg-[#E3D5C8]";
        }
    });
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if(targetTab) targetTab.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${tabId}`);
    if(activeNav) {
        activeNav.className = "px-4 py-2 rounded-lg font-medium text-sm transition bg-[#8D7B68] text-white";
    }

    if(tabId === 'calendar') {
        renderCalendar();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Dashboard & Render
function updateDashboard() {
    const completedCount = todos.filter(t => t.completed).length;
    document.getElementById('stat-completed').textContent = `${completedCount} / ${todos.length}`;
    document.getElementById('stat-courses').textContent = courses.length;
    document.getElementById('stat-focus-time').textContent = `${focusMinutesTotal} 分鐘`;

    const dashTodoList = document.getElementById('dash-todo-list');
    dashTodoList.innerHTML = todos.slice(0, 3).map(t => `
        <div class="flex items-center justify-between p-2.5 bg-[#FDFBF7] rounded-lg border border-[#E3D5C8]">
            <span class="text-sm ${t.completed ? 'line-through text-stone-400' : 'text-[#4A3B32]'}">${t.text}</span>
            <span class="text-xs text-stone-400">${t.date}</span>
        </div>
    `).join('') || '<p class="text-xs text-stone-400">目前沒有待辦事項</p>';

    const dashCourseList = document.getElementById('dash-course-list');
    dashCourseList.innerHTML = courses.slice(0, 3).map(c => `
        <div class="flex items-center space-x-3 p-2.5 bg-[#FDFBF7] rounded-lg border border-[#E3D5C8]">
            <span class="w-3 h-3 rounded-full" style="background-color: ${c.color}"></span>
            <span class="text-sm font-medium text-[#4A3B32]">${c.name}</span>
        </div>
    `).join('') || '<p class="text-xs text-stone-400">目前沒有註冊課程</p>';

    renderCourses();
    renderTodos();
}

// Courses Logic
function addCourse(e) {
    e.preventDefault();
    const name = document.getElementById('course-name').value;
    const color = document.getElementById('course-color').value;
    courses.push({ id: Date.now(), name, color });
    document.getElementById('course-form').reset();
    saveData();
}

function deleteCourse(id) {
    courses = courses.filter(c => c.id !== id);
    saveData();
}

function renderCourses() {
    const container = document.getElementById('course-list-container');
    container.innerHTML = courses.map(c => `
        <div class="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-xl border border-[#E3D5C8] shadow-sm">
            <div class="flex items-center space-x-3">
                <span class="w-4 h-4 rounded-full shadow-sm" style="background-color: ${c.color}"></span>
                <span class="font-bold text-[#4A3B32]">${c.name}</span>
            </div>
            <button onclick="deleteCourse(${c.id})" class="text-stone-400 hover:text-red-500 transition text-sm"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('') || '<p class="text-stone-400 text-sm">尚無課程資料。</p>';
}

// Todos Logic
function addTodo(e) {
    e.preventDefault();
    const text = document.getElementById('todo-text').value;
    const date = document.getElementById('todo-date').value;
    todos.push({ id: Date.now(), text, date, completed: false });
    document.getElementById('todo-form').reset();
    saveData();
}

function toggleTodo(id) {
    todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveData();
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveData();
}

function renderTodos() {
    const container = document.getElementById('todo-list-container');
    document.getElementById('todo-count').textContent = `共 ${todos.length} 項任務`;
    container.innerHTML = todos.map(t => `
        <div class="flex items-center justify-between p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E3D5C8] shadow-sm">
            <div class="flex items-center space-x-3">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTodo(${t.id})" class="w-4 h-4 text-[#8D7B68] rounded focus:ring-[#8D7B68] cursor-pointer">
                <span class="text-sm ${t.completed ? 'line-through text-stone-400' : 'text-[#4A3B32] font-medium'}">${t.text}</span>
            </div>
            <div class="flex items-center space-x-3">
                <span class="text-xs text-stone-400"><i class="fa-regular fa-calendar mr-1"></i>${t.date}</span>
                <button onclick="deleteTodo(${t.id})" class="text-stone-400 hover:text-red-500 transition text-sm"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('') || '<p class="text-stone-400 text-sm">目前沒有待辦任務。</p>';
}

// ==========================================
// Google 風格多檢視行事曆邏輯 (年、月、週、日時間軸)
// ==========================================
let currentCalendarDate = new Date();
let currentView = 'month'; // 'year', 'month', 'week', 'day'

function setCalendarView(view) {
    currentView = view;
    ['year', 'month', 'week', 'day'].forEach(v => {
        const btn = document.getElementById(`view-btn-${v}`);
        if(btn) {
            if(v === view) {
                btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-[#8D7B68] text-white";
            } else {
                btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition text-[#4A3B32]";
            }
        }
    });
    renderCalendar();
}

function navigateCalendar(direction) {
    if (currentView === 'year') {
        currentCalendarDate.setFullYear(currentCalendarDate.getFullYear() + direction);
    } else if (currentView === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    } else if (currentView === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + (direction * 7));
    } else if (currentView === 'day') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + direction);
    }
    renderCalendar();
}

function setTodayCalendar() {
    currentCalendarDate = new Date();
    renderCalendar();
}

function renderCalendar() {
    const container = document.getElementById('calendar-view-container');
    const titleEl = document.getElementById('calendar-title');
    if(!container || !titleEl) return;

    container.innerHTML = '';

    if (currentView === 'year') {
        renderYearView(titleEl, container);
    } else if (currentView === 'month') {
        renderMonthView(titleEl, container);
    } else if (currentView === 'week') {
        renderWeekView(titleEl, container);
    } else if (currentView === 'day') {
        renderDayTimeGridView(titleEl, container);
    }
}

// 1. 年檢視
function renderYearView(titleEl, container) {
    const year = currentCalendarDate.getFullYear();
    titleEl.textContent = `${year}年`;
    
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

    for (let m = 0; m < 12; m++) {
        const monthCard = document.createElement('div');
        monthCard.className = "bg-[#FDFBF7] p-3 rounded-xl border border-[#E3D5C8] shadow-sm";
        
        const mTitle = document.createElement('div');
        mTitle.className = "font-bold text-sm text-[#8D7B68] mb-2 text-center";
        mTitle.textContent = `${m + 1}月`;
        monthCard.appendChild(mTitle);

        const miniGrid = document.createElement('div');
        miniGrid.className = "grid grid-cols-7 gap-1 text-center text-[10px]";
        
        ['日','一','二','三','四','五','六'].forEach(d => {
            const dHeader = document.createElement('div');
            dHeader.className = "text-stone-400 font-semibold";
            dHeader.textContent = d;
            miniGrid.appendChild(dHeader);
        });

        const firstDayIndex = new Date(year, m, 1).getDay();
        const totalDays = new Date(year, m + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            miniGrid.appendChild(document.createElement('div'));
        }

        for (let d = 1; d <= totalDays; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = "p-1 rounded text-stone-700";
            dayCell.textContent = d;
            
            const fmtM = String(m + 1).padStart(2, '0');
            const fmtD = String(d).padStart(2, '0');
            const dateStr = `${year}-${fmtM}-${fmtD}`;
            
            if (todos.some(t => t.date === dateStr) || calendarEvents.some(e => e.date === dateStr)) {
                dayCell.className += " bg-[#F5EBE6] font-bold text-[#8D7B68] border border-[#E3D5C8]";
            }
            miniGrid.appendChild(dayCell);
        }
        monthCard.appendChild(miniGrid);
        grid.appendChild(monthCard);
    }
    container.appendChild(grid);
}

// 2. 月檢視
function renderMonthView(titleEl, container) {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    titleEl.textContent = `${year}年 ${month + 1}月`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="grid grid-cols-7 gap-2 text-center font-bold text-sm text-[#8D7B68] mb-2">
            <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
        </div>
        <div id="month-grid" class="grid grid-cols-7 gap-2"></div>
    `;
    container.appendChild(wrapper);

    const grid = document.getElementById('month-grid');
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = "h-28 bg-stone-50 rounded-xl border border-transparent";
        grid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = "h-28 bg-[#FDFBF7] rounded-xl border border-[#E3D5C8] p-2 flex flex-col justify-between overflow-hidden shadow-sm";
        
        const fmtM = String(month + 1).padStart(2, '0');
        const fmtD = String(day).padStart(2, '0');
        const dateString = `${year}-${fmtM}-${fmtD}`;

        const dayHeader = document.createElement('div');
        dayHeader.className = "text-xs font-bold text-[#4A3B32]";
        dayHeader.textContent = day;
        cell.appendChild(dayHeader);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = "space-y-1 overflow-y-auto max-h-16 text-xs";
        
        todos.filter(t => t.date === dateString).forEach(t => {
            const badge = document.createElement('div');
            badge.className = `p-1 rounded truncate text-[10px] ${t.completed ? 'bg-stone-200 text-stone-400 line-through' : 'bg-[#F5EBE6] text-[#4A3B32] font-medium border border-[#E3D5C8]'}`;
            badge.textContent = `📝 ${t.text}`;
            itemsContainer.appendChild(badge);
        });

        calendarEvents.filter(e => e.date === dateString).forEach(e => {
            const badge = document.createElement('div');
            badge.className = "p-1 rounded truncate text-[10px] bg-[#8D7B68] text-white font-medium";
            badge.textContent = `🕒 ${e.time} ${e.title}`;
            itemsContainer.appendChild(badge);
        });

        cell.appendChild(itemsContainer);
        grid.appendChild(cell);
    }
}

// 3. 週檢視
function renderWeekView(titleEl, container) {
    const curr = new Date(currentCalendarDate);
    const firstDayOfWeek = curr.getDate() - curr.getDay();
    const startOfWeek = new Date(curr.setDate(firstDayOfWeek));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    titleEl.textContent = `${startOfWeek.getFullYear()}年 ${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;

    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 md:grid-cols-7 gap-3";

    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const dayCol = document.createElement('div');
        dayCol.className = "bg-[#FDFBF7] p-3 rounded-xl border border-[#E3D5C8] shadow-sm min-h-[300px] flex flex-col justify-between";
        
        const header = document.createElement('div');
        header.className = "border-b border-[#E3D5C8] pb-2 mb-2 text-center";
        header.innerHTML = `<span class="text-xs text-stone-500 block">${['週日','週一','週二','週三','週四','週五','週六'][i]}</span><span class="font-bold text-[#4A3B32] text-sm">${d.getMonth() + 1}/${d.getDate()}</span>`;
        dayCol.appendChild(header);

        const content = document.createElement('div');
        content.className = "space-y-2 overflow-y-auto flex-grow text-xs";

        todos.filter(t => t.date === dateStr).forEach(t => {
            const b = document.createElement('div');
            b.className = `p-1.5 rounded ${t.completed ? 'bg-stone-200 text-stone-400 line-through' : 'bg-[#F5EBE6] text-[#4A3B32] border border-[#E3D5C8]'}`;
            b.textContent = `📝 ${t.text}`;
            content.appendChild(b);
        });

        calendarEvents.filter(e => e.date === dateStr).forEach(e => {
            const b = document.createElement('div');
            b.className = "p-1.5 rounded bg-[#8D7B68] text-white font-medium";
            b.textContent = `🕒 ${e.time} ${e.title}`;
            content.appendChild(b);
        });

        dayCol.appendChild(content);
        grid.appendChild(dayCol);
    }
    container.appendChild(grid);
}

// ==========================================
// 4. 日檢視：Google 風格 24 小時時間軸 (Time Grid)
// ==========================================
function renderDayTimeGridView(titleEl, container) {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const day = currentCalendarDate.getDate();
    
    titleEl.textContent = `${year}年 ${month + 1}月 ${day}日 (${['週日','週一','週二','週三','週四','週五','週六'][currentCalendarDate.getDay()]})`;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const timeGridWrapper = document.createElement('div');
    timeGridWrapper.className = "bg-[#FDFBF7] rounded-xl border border-[#E3D5C8] shadow-sm overflow-y-auto max-h-[600px] relative";

    // 產生 00:00 到 23:00 的 24 小時時間軸
    let hoursHtml = '';
    for (let hour = 0; hour < 24; hour++) {
        const timeLabel = `${String(hour).padStart(2, '0')}:00`;
        
        // 找出這個小時的所有行程與任務
        const matchedEvents = calendarEvents.filter(e => e.date === dateStr && e.time.startsWith(String(hour).padStart(2, '0')));
        const matchedTodos = todos.filter(t => t.date === dateStr); // 放在當日置頂區

        hoursHtml += `
            <div class="flex border-b border-[#E3D5C8] min-h-[60px] group hover:bg-[#F5EBE6]/30 transition cursor-pointer" onclick="openEventModalWithTime('${dateStr}', '${String(hour).padStart(2, '0')}:00')">
                <div class="w-20 py-2 pr-3 text-right text-xs text-stone-400 font-mono border-r border-[#E3D5C8]">${timeLabel}</div>
                <div class="flex-grow p-2 relative flex flex-wrap gap-2 items-center">
                    ${matchedEvents.filter(e => e.time.split(':')[0] == String(hour).padStart(2, '0')).map(e => `
                        <div class="bg-[#8D7B68] text-white text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center space-x-2">
                            <i class="fa-solid fa-clock text-[10px]"></i>
                            <span class="font-bold">${e.title}</span>
                            <span class="text-[10px] opacity-75">(${e.repeat === 'weekly' ? '每週重複' : e.repeat === 'daily' ? '每天重複' : '單次'})</span>
                        </div>
                    `).join('')}
                    <span class="text-[10px] text-stone-300 opacity-0 group-hover:opacity-150 transition">+ 點擊此時段新增行程</span>
                </div>
            </div>
        `;
    }

    timeGridWrapper.innerHTML = `
        <div class="p-3 bg-[#F5EBE6] border-b border-[#E3D5C8] text-xs font-bold text-[#4A3B32]">
            💡 提示：點擊任一小時的時間軸空白處，即可快速新增該時段的課程或作業！
        </div>
        ${hoursHtml}
    `;

    container.appendChild(timeGridWrapper);
}

// Modal 控制邏輯
function openEventModalWithTime(dateStr, timeStr) {
    document.getElementById('modal-event-date').value = dateStr;
    document.getElementById('modal-event-time').value = timeStr;
    document.getElementById('event-modal').classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.add('hidden');
    document.getElementById('event-form').reset();
}

function handleEventSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('modal-event-title').value;
    const type = document.getElementById('modal-event-type').value;
    const repeat = document.getElementById('modal-event-repeat').value;
    const date = document.getElementById('modal-event-date').value;
    const time = document.getElementById('modal-event-time').value;

    // 1. 建立行事曆行程
    const newEvent = { id: Date.now(), title, type, repeat, date, time };
    calendarEvents.push(newEvent);

    // 2. 如果選擇的是「作業/任務」，自動同步新增到待辦事項中！
    if (type === 'task') {
        todos.push({ id: Date.now() + 1, text: title, date: date, completed: false });
    }

    // 3. 如果選擇的是「課程」，自動同步新增到課程管理中！
    if (type === 'course') {
        courses.push({ id: Date.now() + 2, name: title, color: '#8D7B68' });
    }

    closeEventModal();
    saveData();
    alert('行程新增成功！已自動同步至對應的時間軸與管理模組。');
}

// Pomodoro Timer Logic
let timer = null;
let timeLeft = 25 * 60;
let isRunning = false;
let currentMode = 'focus';

function setTimerMode(mode) {
    currentMode = mode;
    clearInterval(timer);
    isRunning = false;
    document.getElementById('timer-toggle-btn').textContent = '開始專注';
    if (mode === 'focus') {
        timeLeft = 25 * 60;
        document.getElementById('mode-focus').className = "px-4 py-1.5 rounded-full text-xs font-bold bg-[#8D7B68] text-white transition";
        document.getElementById('mode-break').className = "px-4 py-1.5 rounded-full text-xs font-bold bg-[#F5EBE6] text-[#4A3B32] transition";
    } else {
        timeLeft = 5 * 60;
        document.getElementById('mode-break').className = "px-4 py-1.5 rounded-full text-xs font-bold bg-[#8D7B68] text-white transition";
        document.getElementById('mode-focus').className = "px-4 py-1.5 rounded-full text-xs font-bold bg-[#F5EBE6] text-[#4A3B32] transition";
    }
    updateTimerDisplay();
}

function toggleTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        document.getElementById('timer-toggle-btn').textContent = '繼續專注';
    } else {
        isRunning = true;
        document.getElementById('timer-toggle-btn').textContent = '暫停';
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timer);
                isRunning = false;
                document.getElementById('timer-toggle-btn').textContent = '開始專注';
                if (currentMode === 'focus') {
                    focusMinutesTotal += 25;
                    saveData();
                    alert('太棒了！完成一個 25 分鐘專注，已自動累計至學習時間！');
                } else {
                    alert('休息時間結束！準備好展開下一段專注了嗎？');
                }
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('timer-toggle-btn').textContent = '開始專注';
    timeLeft = currentMode === 'focus' ? 25 * 60 : 5 * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer-display').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Initialize on load
window.onload = function() {
    updateDashboard();
    updateTimerDisplay();
};