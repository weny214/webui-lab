document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");
    // -----------------------------------------------------
    // 1. 處理右上角今日日期的顯示
    // -----------------------------------------------------
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
    try {
        const calendarEl = document.getElementById('calendar');
        const sidebarToggle = document.getElementById("sidebar-toggle");

        if(sidebarToggle && sidebar) {
            sidebarToggle.addEventListener("click", function () {
                //如果sidebar有is-collapsed這個class就移除，沒有就加上
                sidebar.classList.toggle("is-collapsed");

                //延遲一下讓側邊欄動畫完成再跑，衝重新計算行事曆尺寸，避免破圖
                SetTimeout(() => {
                    if (window.calendarApp) {
                        window.calendarApp.updateSize();
                    }
                }, 300); // 300毫秒延遲，與CSS動畫時間一致
            });
        }       
    } catch (error) {
        console.error("初始化行事曆時發生錯誤：", error);
    }
    // -----------------------------------------------------
    //  3. 側邊欄收折切換功能
    //  -----------------------------------------------------
    try {
        const calendarEl = document.getElementById('calendar');
        
        if (calendarEl && typeof FullCalendar !== 'undefined') {
            window.calendarApp = new FullCalendar.Calendar(calendarEl, {
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
                        start: new Date().toISOString().split('T')[0]
                    }
                ]
            });
            window.calendarApp.render();
        } else {
            console.error("行事曆容器不存在或 FullCalendar 尚未載入。");
        }
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
