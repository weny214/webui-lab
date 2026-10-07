// 找出 HTML 裡放日期的那個元素
const dateElement = document.getElementById("today-date");

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
});
