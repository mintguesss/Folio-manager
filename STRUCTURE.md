# 專案結構說明

```
src/
├── app/                          # Next.js App Router 根目錄
│   ├── layout.tsx                # 全站根 layout（字型、metadata、PWA 初始化）
│   ├── page.tsx                  # 根路由，直接 redirect 到 /dashboard
│   ├── globals.css               # 全域樣式（Tailwind base）
│   ├── manifest.ts               # PWA manifest（名稱、圖示、顯示模式）
│   ├── icon.tsx                  # 自動產生 192x192 PNG app 圖示
│   ├── apple-icon.tsx            # 自動產生 180x180 iOS 主畫面圖示
│   │
│   ├── login/
│   │   ├── page.tsx              # 登入/註冊頁（server component，重定向）
│   │   └── LoginClient.tsx       # 登入表單（client component）
│   │
│   ├── (app)/                    # 需要登入的頁面群組（有共用 layout）
│   │   ├── layout.tsx            # 登入後的 layout（導覽列、手機底部 nav）
│   │   ├── loading.tsx           # 全站 loading skeleton
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 資產總覽：各帳戶餘額 + 資產成長圖表
│   │   │
│   │   ├── networth/
│   │   │   ├── page.tsx          # 淨資產快照列表（手動輸入每日資產）
│   │   │   └── edit/[date]/
│   │   │       └── page.tsx      # 編輯特定日期的資產快照
│   │   │
│   │   ├── assets/
│   │   │   ├── page.tsx          # 資產快照管理頁
│   │   │   └── AssetForm.tsx     # 新增/編輯資產快照表單
│   │   │
│   │   ├── stocks/
│   │   │   ├── page.tsx          # 股票首頁（redirect 到 positions）
│   │   │   ├── loading.tsx       # 股票頁 loading
│   │   │   ├── positions/
│   │   │   │   └── page.tsx      # 核心：持倉損益、今日損益、已實現損益、個股走勢圖
│   │   │   │                     # 含背景自動同步股價（after()）
│   │   │   ├── trades/
│   │   │   │   ├── page.tsx      # 交易列表（台股/美股）
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # 新增交易
│   │   │   │   └── edit/[id]/
│   │   │   │       └── page.tsx  # 編輯交易
│   │   │   ├── cost/
│   │   │   │   └── page.tsx      # 持倉成本明細（accordion 展開各股交易歷程）
│   │   │   ├── quotes/
│   │   │   │   ├── page.tsx      # 手動報價管理
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # 新增單筆報價
│   │   │   └── charts/
│   │   │       └── page.tsx      # 股票圖表獨立頁（持倉圓餅、損益合計、組合走勢）
│   │   │
│   │   ├── ledger/
│   │   │   ├── page.tsx          # 一般記帳主頁（新增表單 + 記錄列表 + 圖表）
│   │   │   ├── LedgerEntryForm.tsx  # 新增/編輯記帳表單（Combobox 分類/支付方式）
│   │   │   ├── LedgerRecordList.tsx # 記帳列表（手機 accordion / 電腦表格）
│   │   │   └── edit/[id]/
│   │   │       └── page.tsx      # 編輯特定記帳條目
│   │   │
│   │   ├── travel/
│   │   │   ├── page.tsx          # 出國記帳主頁（依旅程分組、多幣別換算）
│   │   │   └── edit/[id]/
│   │   │       └── page.tsx      # 編輯旅程條目
│   │   │
│   │   ├── split/
│   │   │   ├── page.tsx          # 分帳群組列表
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 分帳群組明細（費用列表、篩選、結算）
│   │   │
│   │   ├── spending/
│   │   │   └── page.tsx          # 消費統計 + 信用卡對帳（整合出國記帳與分帳）
│   │   │
│   │   └── trip/
│   │       └── page.tsx          # 旅行行程 Day-by-Day 分頁顯示
│   │
│   ├── actions/                  # Server Actions（表單提交、DB 操作）
│   │   ├── auth.ts               # 登入、登出、註冊
│   │   ├── assets.ts             # 資產快照 CRUD
│   │   ├── stocks.ts             # 交易 CRUD（新增/編輯/刪除交易）
│   │   ├── quotes.ts             # 報價 CRUD + syncLatestQuotes（手動抓股價）
│   │   ├── ledger.ts             # 一般記帳 CRUD
│   │   ├── travel.ts             # 出國記帳 CRUD
│   │   └── split.ts              # 分帳費用 CRUD + 對帳標記
│   │
│   └── api/                      # API Routes
│       ├── cron/sync-quotes/
│       │   └── route.ts          # Vercel Cron 定時同步股價
│       ├── fx/
│       │   └── route.ts          # 匯率查詢 API
│       ├── health/
│       │   └── route.ts          # 健康檢查（監控用）
│       └── stocks/
│           ├── fx-rate/
│           │   └── route.ts      # 股票交易匯率查詢
│           └── search/
│               └── route.ts      # 股票代號搜尋
│
├── components/                   # 共用 UI 元件
│   ├── PwaInit.tsx               # 註冊 Service Worker（PWA 安裝用）
│   ├── MobileNav.tsx             # 手機底部導覽列
│   ├── Combobox.tsx              # 自訂下拉選單（可打字 + 選擇）
│   ├── DeleteButton.tsx          # 刪除確認按鈕
│   ├── BackfillFxButton.tsx      # 補填美股歷史匯率按鈕
│   ├── MarketHoursRefresh.tsx    # 盤中自動重新整理頁面
│   ├── SyncQuotesButton.tsx      # 手動同步股價按鈕
│   │
│   ├── AssetGrowthChart.tsx      # 資產成長折線圖（dashboard 用）
│   ├── AssetModal.tsx            # 資產快照編輯 modal
│   ├── NetWorthHistoryChart.tsx  # 淨資產歷史圖表
│   │
│   ├── StockCostAccordion.tsx    # 持倉成本 accordion（交易歷程、損益明細）
│   ├── StockChartsPanel.tsx      # 股票圖表面板（圓餅、損益合計）
│   ├── MarketChartsPanel.tsx     # 持倉損益圖表 + PnlSummaryChart（個股損益走勢）
│   ├── TradeEditForm.tsx         # 交易編輯表單
│   │
│   ├── LedgerChart.tsx           # 記帳每月收支長條圖
│   ├── LedgerCategoryChart.tsx   # 記帳支出分類圓餅圖
│   │
│   ├── TravelEntryForm.tsx       # 出國記帳新增表單
│   ├── TravelSummaryAccordion.tsx # 出國記帳旅程摘要 accordion
│   ├── TravelExpenseList.tsx     # 出國記帳明細列表（日期折疊 + 篩選）
│   │
│   ├── SplitExpenseCard.tsx      # 分帳費用卡片（含分擔明細）
│   ├── SplitExpenseListClient.tsx # 分帳明細列表（日期折疊 + 類別/付款/付款者篩選）
│   │
│   ├── SpendingClient.tsx        # 消費統計 + 對帳 client component
│   │
│   ├── TripClient.tsx            # 行程切換：預設顯示目前行程，「以前行程」按鈕切到舊行程
│   │
│   └── trip/
│       ├── shared.tsx            # 行程共用元件（連結、清單、DayHeader、TabBar、FilterPills）
│       ├── SingaporeTrip.tsx     # 2026/10 新加坡行程（目前）
│       └── JapanTrip.tsx         # 2026/05 日本東京行程（以前，含想日本第 N 天）
│
└── lib/                          # 共用邏輯/工具
    ├── currency.ts               # 出國外幣設定（JPY / SGD：符號、小數位、匯率代號、支付方式）
    ├── stock-utils.ts            # 股價抓取（Yahoo Finance + TWSE）、匯率、同步
    ├── position-calc.ts          # 台股 + 美股 FIFO 損益計算（美股含歷史匯率 TWD 成本）
    ├── market-hours.ts           # 判斷現在是否台/美股盤中
    └── supabase/
        ├── server.ts             # Supabase 客戶端（Server Component / Action 用）
        └── browser.ts            # Supabase 客戶端（Client Component 用）

public/
├── sw.js                         # Service Worker（讓 Chrome 可安裝為 PWA）
├── icon.svg                      # SVG 圖示（瀏覽器 favicon 用）
└── ...                           # 其他靜態資源
```
