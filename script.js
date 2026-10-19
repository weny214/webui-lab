// Data States & LocalStorage
let courses = JSON.parse(localStorage.getItem('studyhub_courses')) || [
    { id: 1, name: '深度學習與電腦視覺', color: '#8D7B68' },
    { id: 2, name: '區塊鏈技術原理', color: '#BC6C25' }
];

let todos = JSON.parse(localStorage.getItem('studyhub_todos')) || [
    { id: 1, text: '完成 Homework 5 專案部署', date: '2026-10-19', completed: false },
    { id: 2, text: '準備微電腦系統實驗報告', date: '2026-10-22', completed: true }
];

let focusMinutesTotal = parseInt(localStorage.getItem('studyhub_focus_time')) || 0;

// Save data helper
function saveData() {
    localStorage.setItem('studyhub_courses', JSON.stringify(courses));
    localStorage.setItem('studyhub_todos', JSON.stringify(todos));
    localStorage.setItem('studyhub_focus_time', focusMinutesTotal);
    updateDashboard();
    
    // 如果當前在行事曆頁面，同步重新渲染
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
    // Stats
    const completedCount = todos.filter(t => t.completed).length;
    document.getElementById('stat-completed').textContent = `${completedCount} / ${todos.length}`;
    document.getElementById('stat-courses').textContent = courses.length;
    document.getElementById('stat-focus-time').textContent = `${focusMinutesTotal} 分鐘`;

    // Dash Todo Preview
    const dashTodoList = document.getElementById('dash-todo-list');
    dashTodoList.innerHTML = todos.slice(0, 3).map(t => `
        <div class="flex items-center justify-between p-2.5 bg-[#FDFBF7] rounded-lg border border-[#E3D5C8]">
            <span class="text-sm ${t.completed ? 'line-through text-stone-400' : 'text-[#4A3B32]'}">${t.text}</span>
            <span class="text-xs text-stone-400">${t.date}</span>
        </div>
    `).join('') || '<p class="text-xs text-stone-400">目前沒有待辦事項</p>';

    // Dash Course Preview
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

// Calendar Logic
let currentCalendarDate = new Date();

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const titleEl = document.getElementById('calendar-month-title');
    if(titleEl) {
        titleEl.textContent = `${year}年 ${month + 1}月`;
    }

    const gridContainer = document.getElementById('calendar-grid');
    if(!gridContainer) return;
    gridContainer.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = "h-24 bg-stone-50 rounded-xl border border-transparent";
        gridContainer.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = "h-24 bg-[#FDFBF7] rounded-xl border border-[#E3D5C8] p-2 flex flex-col justify-between overflow-hidden shadow-sm";
        
        const formattedMonth = String(month + 1).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateString = `${year}-${formattedMonth}-${formattedDay}`;

        const dayHeader = document.createElement('div');
        dayHeader.className = "text-xs font-bold text-[#4A3B32]";
        dayHeader.textContent = day;
        cell.appendChild(dayHeader);

        const dayTodosContainer = document.createElement('div');
        dayTodosContainer.className = "space-y-1 overflow-y-auto max-h-14 text-xs";
        
        const matchedTodos = todos.filter(t => t.date === dateString);
        matchedTodos.forEach(t => {
            const taskBadge = document.createElement('div');
            taskBadge.className = `p-1 rounded truncate ${t.completed ? 'bg-stone-200 text-stone-400 line-through' : 'bg-[#F5EBE6] text-[#4A3B32] font-medium border border-[#E3D5C8]'}`;
            taskBadge.textContent = t.text;
            dayTodosContainer.appendChild(taskBadge);
        });

        cell.appendChild(dayTodosContainer);
        gridContainer.appendChild(cell);
    }
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