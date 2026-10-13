document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");
    // -----------------------------------------------------
    // 1. 處理右上角今日日期的顯示
    // -----------------------------------------------------
    // 初始化 FullCalendar
    /*const dateElement =  document.getElementById("today-date");
    const calendar = new Date();
    const dateText = calendar.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
    });
    dateElement.textContent = dateText;
}*/
try {
        const dateElement = document.getElementById("today-date");
        if (dateElement) {
            const now = new Date();
            const dateText = now.toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long"
            });
            dateElement.textContent = dateText;
            console.log("日期更新成功！");
        }
    } catch (error) {
        console.error("更新日期時發生錯誤：", error);
    }
// -----------------------------------------------------
// 2. 初始化 FullCalendar 行事曆
// ------------------------------------------------.-----
/*const calendarEl = document.getElementById("calendar");
const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "zh-tw", // 設定語言為中文
    headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
    },
    
    buttonText: {
        today: "今天",
        month: "月",
        week: "週",
        day: "日"
    },
    firstDay: 1, // 設定一週的第一天為星期一
    
    height: "100%", // 自動調整高度

    events: [
        {
            title: "資料結構 期中考",
            start: "2024-06-10",
            color: "#ef4444" // 自訂事件顏色
        },
        {
            title: "微算機實驗",
            start: "2024-06-15T14:00:00",
            end: "2024-06-15T16:00:00",
            color: "#3b82f6" // 自訂事件顏色
        }
    ]
});

calendar.render();
*/
try {
        const calendarEl = document.getElementById('calendar');
        
        if (!calendarEl) {
            console.error("找不到 ID 為 'calendar' 的元素！");
            return;
        }

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'zh-tw', 
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
                today: '今天',
                month: '月',
                week: '週',
                day: '日'
            },
            firstDay: 1,
            height: '100%',
            events: [
                {
                    title: '測試行程',
                    start: new Date().toISOString().split('T')[0] // 會在今天顯示一個測試行程
                }
            ]
        });

        calendar.render();
        console.log("行事曆渲染成功！");

    } catch (error) {
        console.error("初始化行事曆時發生錯誤：", error);
    }
});


// 找出 HTML 裡放日期的那個元素
/*const dateElement = document.getElementById("today-date");

// 取得現在的時間
const now = new Date();

// 用台灣習慣顯示：2026年10月3日 星期六
const dateText = now.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
});

dateElement.textContent = dateText;

const dashboardCards = document.querySelectorAll(".dashboard-card");

function selectDashboardCard(event) {
    dashboardCards.forEach((card) => {
        card.classList.remove("is-selected");
    });

    event.currentTarget.classList.add("is-selected");
}

dashboardCards.forEach((card) => {
    card.addEventListener("click", selectDashboardCard);
});*/
