# Navbar 與 Sidebar 改善紀錄

日期：2026-10-28。變更起點：`7b1d386`。
本文件是 AI 整理的工程說明與已執行的測試結果；學生自己的理解與實測仍應由本人記錄。

## 需求與實際 Prompt

使用者希望把總覽儀表板、課程管理、待辦事項、行事曆、番茄鐘移到 Sidebar，Navbar 加入漢堡選單，並將登入狀態移到右側。
確認實作的實際訊息為：

> 好的，請按照你說的做改動

上下文採用先前提出的桌機收合側欄、手機抽屜、共用導覽、帳號選單與鍵盤操作方案。

## 最終行為

| 狀態 | 導覽 | 帳號 |
| --- | --- | --- |
| 未登入 | 側欄與漢堡按鈕隱藏 | Navbar 右側顯示登入按鈕，按下聚焦登入欄位 |
| 已登入、寬度至少 768px | 側欄預設開啟，收合後內容區變寬 | 右側顯示截短的 Email，選單內可讀完整 Email 及登出 |
| 已登入、寬度小於 768px | 側欄預設關閉，開啟後覆蓋畫面並顯示遮罩 | 以頭像字母及可存取名稱提供帳號入口 |

- 桌機與手機使用同一組五個導覽按鈕，移除舊手機底部導覽。
- 選取狀態以 aria-current 與實際內容同步，不依賴兩組不同 ID。
- 手機選取功能後關閉抽屜，焦點移到該功能標題；番茄鐘和輸入狀態不因收合側欄而重設。
- 手機支援關閉按鈕、遮罩、Escape，並在關閉後將焦點交回漢堡按鈕。
- 手機開啟時，Tab 在抽屜內循環，背景設為 inert，鎖定背景捲動。
- 切換到桌機解除模態狀態；切回手機時收合。登出或 session 消失時清理遮罩、捲動及焦點。
- 帳號選單是一般 disclosure，不使用需要額外方向鍵規則的 menu 角色；支援原生 Tab、外部點擊及 Escape。
- 課程狀態、重新讀取與資料儲存說明留在主內容區。
- 導覽本身不發出課程 API 請求；Supabase、資料模型與權限沿用原流程。

## 修改的責任分工

| 檔案 | 內容 |
| --- | --- |
| index.html | Navbar、帳號區、共用 Sidebar、遮罩及內容布局；保留原有課程與登入欄位 ID |
| css/style.css | 真實導覽樣式、CSS 變數、768px 斷點、桌機布局及手機抽屜 |
| js/navigation.js | 導覽開關、帳號 disclosure、焦點、inert、捲動與斷點狀態 |
| script.js | switchTab 沿用內容切換，透過 studyNavigation 同步導覽與手機收合 |
| js/auth.js | applySession 以目前使用者呼叫 studyNavigation.setUser |
| tests/navigation-browser.cjs | 實際 DOM/CSS 的導覽與響應式行為檢查 |
| tests/local-features-browser.cjs | 改從帳號選單操作登出，移除測試注入的 hidden CSS |

載入順序為 script.js → js/navigation.js → js/auth.js。新增檔案不建立另一份登入 session，signedIn 僅是依 auth.js 通知而來的顯示狀態。
Sidebar 的開啟狀態只存在記憶體，重新整理後回到該尺寸的預設狀態。

## W05：Event → Function → DOM

### 漢堡按鈕

1. Event：sidebar-toggle 的 click。
2. Function：toggleSidebar → setSidebarOpen。
3. DOM：更新 hidden、aria-expanded、Sidebar 角色與 app-shell 的 sidebar-open。
4. 手機額外更新：遮罩、背景 inert、body 捲動鎖定，以及焦點。
5. UI：顯示或收合導覽；桌機內容區隨之調整。

### 選取功能

1. Event：Sidebar 中 data-tab 按鈕的 click。
2. Function：switchTab → setActiveNavigation；行事曆仍呼叫 renderCalendar。
3. DOM：顯示目標內容、更新 aria-current；手機透過 afterNavigation 收合並聚焦內容。
4. UI：同一份導覽在各尺寸都反映目前功能。

### 登入與登出

1. 原有 Auth 流程取得 session，applySession 更新使用者與應用程式狀態。
2. setUser 更新 Navbar 帳號、登入按鈕與側欄預設狀態。
3. 登出時清理 disclosure 與模態抽屜，再將焦點交回登入按鈕。

## 自動驗證

先啟動網站，再從專案根目錄執行：

```bash
npm test
npm run check
npm run test:browser:local
```

單獨重跑本次導覽檢查：

```bash
npm run test:browser:navigation
```

預設網站位置為本機 7777；其他來源以 STUDYHUB_TEST_URL 指定。
Playwright 與 Chromium 的安裝方式見 learning-log.md；npm test 本身仍只需要 Node.js。

2026-10-28 實際驗證通過：

- 原有 15 個斷言與 13 個本機回歸案例。
- 五個應用程式 JS 檔案語法檢查。
- 原有三組本機瀏覽器互動檢查。
- 768／1440px：側欄布局、內容擴張、五個功能及選取、帳號開關。
- 320／375px：抽屜、遮罩、焦點循環、Escape、關閉按鈕、選取後焦點、長 Email 與登出。
- 尺寸切換、側欄開啟時 session 消失、登入按鈕聚焦與登入後狀態。
- 切換功能不停止正在執行的番茄鐘。
- 未登入的手機與桌機布局；沒有未捕捉的應用程式錯誤。

測試直接載入專案的 css/style.css，沒有注入替代導覽 CSS。
外部 CDN 被阻擋，Supabase 使用明確的測試替身；因此可證明導覽自有 CSS 的布局與互動，不能推論完整應用程式的 Tailwind 外觀、真實 Auth 或資料庫 RLS 已驗收。

## 學生接續驗收

請在自己的 Ubuntu 啟動網站，使用實際 CDN 樣式與測試帳號檢查：

- Navbar 是否符合自己的品牌與帳號顯示需求。
- 手機、平板、桌機的表單與行事曆是否受側欄寬度影響。
- 鍵盤操作、讀屏需求與實際裝置觸控。
- 真實登入、登出與課程載入是否正常。

自己的說明（待本人填寫）：Event／Listener／Function／DOM／UI／副作用／實測結果／commit hash。
