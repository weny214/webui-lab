# 改善紀錄與 W05／W06 驗證指南

本次基準 commit：`b8fdf26`。紀錄日期：2026-10-27。
這份文件由 AI 整理工程事實與操作步驟；「學生自己的解釋」仍待本人完成，不能視為已驗收或已理解。
本次修改的提交紀錄可用 `git log --oneline` 查閱；完成個人作業紀錄時，請補上對應的實際 commit hash。

## 1. 需求與實際 Prompt

本次使用者實際訊息：

> 開始幫我修改

上下文為前一輪改善清單：本機儲存可靠性、日檢視待辦、重複選項、番茄鐘、測試與課程紀錄。
沒有額外的完整 Event／Function／DOM 格式 Prompt；未保留的歷史提示詞不可事後編造。

本次工程範圍：保留原生 HTML/CSS/JS；先處理已重現的本機問題，不修改 Supabase SQL 或真實帳號資料。

## 2. 完成與待辦

- [x] 本機寫入成功後才提交記憶體狀態、清空表單及顯示成功。
- [x] 新增失敗保留輸入；完成切換及刪除失敗保留原資料。
- [x] 日檢視上方顯示當日待辦、時間與完成狀態；使用文字節點。
- [x] 停用每日／每週新增選項並在提交端檢查；保留既有資料。
- [x] 番茄鐘以截止時間計算，完成當次處理，避免重複計入。
- [x] 專注分鐘寫入失敗時提供重試；未儲存狀態不混入已儲存統計。
- [x] 保留原有 15 個斷言，加入 13 個本機回歸測試與可重跑的瀏覽器檢查。
- [ ] 學生以自己的文字完成下方互動解釋。
- [ ] 使用真實測試帳號完成 Supabase 讀寫及 A/B 隔離驗證。
- [ ] 使用實際 CDN 樣式完成手機、平板、桌機與公開 HTTPS 驗證。
- [ ] 確認老師是否指定直接使用 fetch 或 Google OAuth。
- [ ] 將本次修正的 commit hash 補入學生自己的作業紀錄。
- [ ] 後續再逐模組拆分 script.js；本次維持既有載入方式。

## 3. 主要修改與教學閱讀順序

先執行 `git diff -- script.js index.html package.json`，查看實際差異。
新增測試與本文件若尚未追蹤，請另外開啟檔案；一般 git diff 不會顯示未追蹤檔案。

### 本機儲存：候選狀態 → 持久化 → 更新畫面

1. 從 `addTodo()` 或 `handleEventSubmit()` 找到表單提交入口。
2. 觀察它們如何建立新陣列，而非先修改原陣列。
3. 進入 `saveData(changes)`：寫入失敗回傳 false，原陣列與畫面資料不變。
4. 寫入成功才更新狀態、重新繪製清單，並讓呼叫端清空表單或關閉視窗。
5. `toggleTodo()` 寫入失敗會重畫清單，將瀏覽器已切換的 checkbox 回復原狀。

技術流程：

`submit → handleEventSubmit → saveData → 成功才 closeEventModal → UI 完成`

失敗流程：

`submit → saveData 回傳 false → 保留輸入、視窗與原資料 → 使用者重試`

### 日檢視

`setCalendarView('day') → renderCalendar → renderDayTimeGridView`

當日待辦只篩選一次，放在時間軸上方。文字以 textContent 設定；完成項目加上完成符號與刪除線。
重複活動的舊標記保留，但標示尚未展開；新表單只支援單次行程。

### 番茄鐘

`toggleTimer → 設定截止時間 → updateTimer → 計算剩餘時間 → 完成並儲存`

暫停時保留毫秒餘額；繼續時重設截止時間，暫停期間不扣秒。
完成一輪只處理一次。寫入失敗的分鐘存於記憶體，顯示「重新儲存」，成功後才增加已儲存統計。
未儲存分鐘在重新整理或登出後會遺失，介面已有提示；不同帳號不繼承這些分鐘。
計時器執行狀態本身仍不跨重新整理保存。

## 4. 已執行的檢查與重跑方式

從專案根目錄執行：

```bash
npm test
npm run check
```

2026-10-27 實際結果：

- 原有課程／登入 mock 測試：15 個斷言通過。
- 新增本機回歸案例：13 passed、0 failed、0 skipped。
- 四個應用程式 JavaScript 檔案語法檢查通過。

本機回歸包含新增／切換／刪除失敗、三種行程類型重試、重複設定拒絕、舊資料保留、日檢視文字節點、截止完成、延遲回呼、暫停、重設、休息、儲存重試及帳號切換。

### 可選的 Chromium 互動檢查

這一項需要 Playwright 與瀏覽器；npm test 不需要這些額外工具。
本次雲端環境已提供 Playwright 1.62.1 及 Chromium。其他環境若未提供，可先安裝測試工具：

```bash
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
```

安裝仍須保持 TLS 驗證；不要用略過憑證驗證的參數處理下載失敗。
如果已有 Chromium，可用 CHROMIUM_EXECUTABLE_PATH 指定執行檔。

先在一個終端機啟動網站，再在另一個終端機執行：

```bash
python -m http.server 7777
```

```bash
npm run test:browser:local
```

本次三組互動檢查通過：

1. 真實待辦表單失敗保留、成功重設、checkbox 寫入失敗回復。
2. 真實行程視窗失敗重試、日檢視文字安全呈現、重複選項與提交檢查。
3. 可控制時鐘下的完成、儲存重試、只累計一次及登出清理。

**測試範圍限制：**Supabase 由明確的測試替身提供；外部網路請求阻擋；僅補入 hidden 類別的顯示規則。
這驗證真實 DOM、表單重設及事件互動，不代表真實登入、資料庫、CDN 載入或 RWD 已通過。
測試使用獨立瀏覽器 context，不讀寫既有瀏覽器帳號或資料。

## 5. W05：學生自己的解釋（待填）

請挑本次一個改善項目，以自己的文字填寫，不要直接把上方 AI 技術說明當成本人理解證據。

- 原始需求：
- 實際使用的 Prompt 與上下文：
- Event：
- Listener／綁定位置：
- Function：
- DOM target 與變化：
- 預期 UI：
- 可能副作用：
- 親自執行的步驟與結果：
- Git commit hash：

## 6. W06：從現有課程 API 練習追蹤

1. 使用測試帳號登入，在瀏覽器開啟 Network，清空先前紀錄。
2. 按「重新讀取雲端課程」，找出 courses 請求。
3. 對照 auth.js 的 course-reload listener、courseService.list()、applySession 與 updateDashboard()／renderCourses()。
4. 記錄實際 URL、HTTP method、狀態、JSON 結構、認證來源與 DOM 更新；截圖時遮蔽 Authorization 及 token。
5. 在 Network 切成 Offline 後嘗試儲存課程，檢查輸入是否保留與錯誤訊息，再恢復網路。
6. 以自己的文字回答下列問題，記錄真正發生的 HTTP／token／CORS／JSON／DOM 問題之一；沒有發生 CORS 就不要編造。

目前程式使用 Supabase SDK；自有檔案沒有直接的 fetch 呼叫。要區分 SDK 呼叫點與底層 HTTP。
這不是 Google OAuth 實作；是否需要另外實作 fetch／Google OAuth，仍待老師確認。

待填 Review：

1. SDK／fetch 呼叫位於哪個函式？
2. 哪個事件觸發？
3. 實際 HTTP method？
4. Authentication 如何提供？
5. Response 格式？
6. 誰處理回傳資料？
7. 誰更新 DOM？
8. HTTP／網路錯誤如何處理？
9. Frontend 與 API 的實際 Origin，是否跨來源？
10. 若為 CORS，應在哪一層確認設定？

Debug 紀錄：日期、操作、預期、實際回應、判斷層級、原因、處理方式、重測結果。

## 7. 真實雲端與公開展示驗收（尚未執行）

使用者已回報執行 001_courses.sql；本次未重跑 migration，亦未修改線上資料。

| 操作 | 應確認的結果 | 實際結果 |
| --- | --- | --- |
| A 新增／編輯後重新整理 | 課程資料保留 | 待測 |
| A 軟刪除 | 活動清單不顯示，資料保留刪除標記 | 待測 |
| B 列出／指定 A 的課程 ID | 無法取得 A 的資料 | 待測 |
| B 嘗試更新 A 的課程 | A 的資料未變更 | 待測 |
| B 使用 A 的 user_id 新增 | 被拒絕 | 待測 |
| 修改擁有者或實體 DELETE | 被權限拒絕 | 待測 |
| 真實樣式下 375／768／1440 px | 表單、導覽、視窗、行事曆可操作，無遮擋 | 待測 |
| 未登入瀏覽器開啟正式 HTTPS 網址 | 頁面與資源正常，代表性操作成功 | 待測 |

RLS 可能回傳空陣列或影響零筆資料，不一定是 403；必須確認資料未洩漏、未遭修改。
匿名請求被拒絕不能取代 A/B 驗收，也不要因此授予 anon 讀取課程權限。
