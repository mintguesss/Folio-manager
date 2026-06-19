# Folio Manager
> 個人財務 + 投資全方位管理 Web App，免費部署、可安裝為 PWA。

---

## ✨ 技術亮點

- **多市場股票損益引擎**：台股與美股均採 FIFO（先進先出）計算已實現損益；美股另以歷史匯率（fx_rate 欄位）獨立追蹤台幣成本，避免以當日匯率換算造成的損益失真
- **Next.js Server + Client 混合架構**：資料密集的計算（持倉損益、統計彙整）在 Server Component 完成再傳給 Client，Map/Set 等不可序列化型別（Map、Set）在 Client 端以 `useMemo` 重建，配合 Supabase RLS 做多使用者資料隔離
- **盤中背景自動同步**：頁面請求完成後以 `after()` 觸發非同步股價同步，根據 `isMarketHours()` 動態調整節流閾值（盤中 2 min、盤後 8 hr），搭配 Vercel Cron 定時補底
- **多使用者分帳正確歸屬**：透過 `split_group_users` 關聯表取得每位使用者的 member ID，確保各自只看到自己實際參與的費用與分攤金額，避免不同帳號互看對方資料；消費統計整合出國記帳與分帳，支援 TWD / JPY 雙幣別即時彙整

---

## 🛠 技術棧

| 項目 | 技術 |
|------|------|
| 框架 | Next.js 16 (App Router) + TypeScript |
| 樣式 | Tailwind CSS v4 |
| 資料庫 / Auth | Supabase（PostgreSQL + RLS 多使用者隔離）|
| 圖表 | Recharts |
| 部署 | Vercel（含 Cron Job）|
| 股價來源 | Yahoo Finance API、TWSE MIS API |

---

## 📦 功能總覽

### 股票記帳
- **持倉損益**（`/stocks/positions`）：台股 WAC / 美股 FIFO，未實現/已實現損益，今日損益（依昨收計算），市值/成本欄（台股 TWD；美股 USD 主 + TWD 換算）
- **持倉成本明細**（`/stocks/cost`）：Accordion 展開每檔股票完整交易歷程，含攤後均價、累積損益
- **個股損益走勢圖**：三模式（合計 / 已實現 / 未實現）× 損益金額 / 報酬率，自選日期範圍與股票
- **股票圖表**（`/stocks/charts`）：持倉市值圓餅、損益合計圓餅（含已實現）、組合市值走勢折線
- 自動抓股價：盤中背景同步 + 一鍵手動同步；美股匯率一鍵回填

### 分帳（`/split`）
- 建立群組、邀請成員，自訂每人分擔金額（不限平均分攤）
- 多幣別支援（TWD、JPY 等）
- 明細列表：日期折疊 + 類別 / 付款方式 / 付款者篩選，篩選後即時顯示 JPY + TWD 合計
- Supabase RLS 確保各用戶只看到自己相關費用

### 消費統計 ＆ 對帳（`/spending`）
- 整合出國記帳與分帳的消費彙整，依類別、付款方式統計
- **信用卡對帳**（限定帳號）：依付款方式列出待對帳項目，日期分組，顯示 TWD / JPY 合計，可標記已對帳

### 出國記帳（`/travel`）
- 多幣別自動換算台幣，依旅程分組，支援多次旅行
- 明細列表：日期折疊 + 類別 / 付款方式篩選，顯示 JPY + TWD 總計

### 一般記帳（`/ledger`）
- 收入 / 支出 / 轉帳，自訂分類與支付方式（Combobox 可打字搜尋）
- 手機：Accordion 展開；電腦：完整表格
- 每月收支長條圖、支出分類圓餅圖

### 資產快照（`/assets` / `/networth`）
- 每日手動輸入各帳戶餘額，資產成長折線圖

---

## 🚀 快速開始

```bash
# 1. Clone & 安裝
git clone <repo-url>
npm install

# 2. 建立環境變數
cp .env.example .env.local
# 填入 Supabase URL + anon key

# 3. 啟動開發伺服器
npm run dev
```

開啟 `http://localhost:3000`

### 環境變數

```
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon key
```

---

## 📁 專案結構

詳見 [STRUCTURE.md](./STRUCTURE.md)

---

## ⚙️ 設定與部署

### Supabase

1. 到 [supabase.com](https://supabase.com/) 建立新專案
2. Dashboard → **SQL Editor**，依序執行：
   - `supabase/schema.sql`
   - `supabase/migrations/` 下所有 migration 檔案（依序）
3. Dashboard → **Project Settings → API** 取得 URL 和 anon key

### Vercel

1. [vercel.com](https://vercel.com/) → Import Git Repository
2. 設定 Environment Variables（同 `.env.local`）
3. Deploy

之後推 commit 到 `main`，Vercel 自動重新部署。

### 安裝為 PWA

**Android（Chrome）**：右上角選單 → 「新增到主畫面」

**iOS（Safari）**：底部分享按鈕 → 「加入主畫面」（必須用 Safari）

---

## GitHub 協作

邀請共同開發：Repo → **Settings → Collaborators → Invite**

只是要用網站的朋友：直接給網址，到 `/login` 自行註冊。
