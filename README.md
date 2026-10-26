# Study Hub — 個人學習管理平台

網頁程式設計課程專案。學號：112321012。

## 本批範圍與真實進度

- 新增 Supabase Email／密碼註冊、登入、登出。
- 課程雲端新增、編輯、軟刪除：名稱、顏色、教師、教室。
- 以 PostgreSQL grants + RLS 隔離帳號資料。
- 作業、行事曆、番茄鐘仍為既有本機功能，本批只按帳號隔離儲存，**尚未雲端同步**。
- 重複排程、單次例外、課程排程連動、自訂番茄鐘與各科統計為下一階段。
- LINE 僅為規劃。
- 舊版 studyhub_* 測試資料不刪除、不自動上傳。新版本機模組使用 studyhub_local_<user-id>。
- 本批順便修正月底切換月份溢位，以及番茄鐘在 00:00 重開時再次累計的問題；不代表整個計時器已重構。

## 1. Supabase 必要設定

在 **SQL Editor → New query** 貼入 [001_courses.sql](supabase/migrations/001_courses.sql) 並執行一次。

SQL 建立 courses、索引、授權與 RLS，不刪除既有表。如果 courses 已存在，先檢查現有結構，不要自行 DROP 或重跑不同版本。DDL 使用 transaction，失敗時回滾該交易。

專案設定：
- Enable Data API 開啟。
- Automatically expose new tables 關閉。
- Enable automatic RLS 開啟；SQL 也明確啟用 RLS，不依賴介面預設。
- Email 登入、允許註冊、Confirm Email 開啟。
- Auth Site URL 開發階段為 http://localhost:7777/ ；Redirect URLs 加入相同網址。
- 如果使用 127.0.0.1 或其他 port，需加入實際網址。
- 註冊的回跳位置由目前頁面所在目錄計算；部署後須加入含子路徑的正式網址。

**寄信限制**：Supabase 預設寄信服務只寄給專案團隊成員信箱，且有嚴格速率限制。先用團隊帳號信箱測試註冊；對外開放註冊前需要自訂 SMTP。不要為了寄驗證信而把一般使用者加入管理團隊。

js/supabase-client.js 包含公開 Project URL 與 publishable key。資料庫密碼、secret／service_role key 不可放在前端或 repo。

## 2. 本機執行

用 VS Code Live Server 開啟專案根目錄，或在根目錄執行：

```bash
python -m http.server 7777
```

開啟 http://localhost:7777/ 。需要網路載入 Supabase SDK、Tailwind、圖示及連接雲端資料。

現有 server.py 也可用 FastAPI 提供靜態檔案；它不是登入或課程 API。這一版由瀏覽器直接連 Supabase。

## 3. GitHub Pages

本分支仍為待驗收版本。合併並確認設定後，可在 repo Settings → Pages 選擇部署來源。

若部署 main 根目錄，預期網址形式是 https://weny214.github.io/webui-lab/ ，**不代表已部署或驗證成功**。正式網址可用後，把 Auth Site URL 更新為它，Redirect URLs 加入相同完整路徑，保留本機開發網址。

## 4. 架構與閱讀順序

| 檔案 | 工作 |
| --- | --- |
| index.html | 登入、已登入畫面、表單 |
| js/supabase-client.js | 初始化 SDK 與公開連線資訊 |
| js/auth.js | 註冊／登入／登出、帳號切換與資料載入 |
| js/course-service.js | 對 courses 發送讀寫請求 |
| script.js | 課程表單與 DOM、既有本機模組 |
| supabase/migrations/001_courses.sql | 資料結構、CHECK、grants、RLS |

### 新增課程：Event → Function → API → Database → DOM

1. Event：course-form submit；HTML onsubmit 呼叫 addCourse(event)。
2. Function：阻止重新載入，trim 名稱，檢查登入及課程載入狀態。
3. API：courseService.create 傳送登入 ID 與課程欄位。
4. Database：grants 檢查操作權限；RLS 檢查 auth.uid() = user_id；CHECK 驗證欄位。
5. 成功回應後才更新記憶體 courses、清空表單並 renderCourses。
6. 失敗保留輸入並顯示錯誤。使用者文字用 textContent 或 escaping，不當成 HTML 執行。

### 登入與權限

- signUp 送出註冊；開啟信箱驗證時，通常不會立即取得 session。
- signInWithPassword 驗證成功後 SDK 管理 session／token。
- 前端隱藏畫面不是安全邊界；真正隔離在資料庫。
- INSERT、UPDATE、SELECT 各有 RLS；user_id、id、created_at 不授權修改。
- 不授予實體 DELETE；刪除時更新 deleted_at，保留歷史。
- authEpoch 是登入世代；切換帳號後，舊請求結果不能寫入新畫面。
- Auth callback 用 setTimeout 排程，不在 callback 內等待其他 Supabase 請求。
- 登出清空課程、待辦、行事曆畫面並重設計時器。
- 本機課程行程尚未連到雲端課程；新增行程不再偷偷新增另一筆本機課程，畫面有說明。

## 5. 自動測試與目前證據

```bash
npm test
```

測試只需 Node.js，不需安裝套件。tests/auth-courses-unit.cjs 使用簡化 DOM 與 mock service，驗證新增、編輯、軟刪除、文字節點、儲存失敗保留輸入、登出清空、帳號本機隔離及忽略過期請求。

交付前已在 JavaScript 執行環境跑過相同測試邏輯並通過，四個 JS 檔案也通過語法解析。
- 真實 Auth settings API 回應 HTTP 200：Email 啟用、註冊啟用、Email 驗證開啟。
- 課程 API 回應 PGRST205／404：交付檢查時 courses 尚未存在於 API schema cache。
- SDK CDN 指定版本回應 HTTP 200。
- **未完成真實瀏覽器、跨電腦、實際 Email 註冊與 RLS 整合測試。**瀏覽器下載失敗，隨後執行環境中斷；不能把 mock 測試當作已完成展示驗收。

## 6. 手動驗收（必要）

- 未登入只顯示登入介面；錯誤密碼有訊息。
- 團隊信箱註冊、收到驗證信、網站執行中完成驗證，再登入。
- 新增課程，重新整理後名稱、顏色、教師及教室仍正確。
- 編輯後重新整理仍保留；刪除前有提示，deleted_at 有值，活動清單不顯示。
- 輸入 HTML 樣式文字，只顯示文字，不執行。
- 模擬斷線儲存：不宣稱成功、不清空輸入。
- 另一台電腦以同帳號登入能讀到課程。
- 測試帳號 B 看不到 A 的課程；還要使用 B 的 API token 指定 A 的課程 ID 嘗試讀寫，確認 RLS 阻擋。
- B 以 A 的 user_id 新增資料應失敗；修改 user_id 或直接 DELETE 應被權限拒絕。
- 慢網路下登出或切換帳號，不殘留舊課程、行事曆或本機待辦。
- 手機／平板／桌面檢查登入表單、課程欄位與按鈕。

## 7. AI 協作紀錄

需求：保留原生 HTML/CSS/JS，加入 Email 登入與課程雲端管理；先實作可解釋的小範圍，再接其他模組。

限制：資料權限在 RLS；publishable key 在前端；安全呈現文字；失敗保留輸入；保留歷史；不將其他模組宣稱為已同步。

學生自行補上：實際測試結果、遇到的錯誤、自己的 Event → Function → API → Database → DOM 解釋及最後合併 commit。這份文件不代寫「已理解／已驗收」的證明。

官方依據：
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/getting-started/api-keys
