# 王國紀元科技樹規劃器

這個專案是一個可部署到 GitHub Pages 的王國紀元科技樹規劃器。它會把遊戲原始科技資料整理成前端可直接讀取的靜態 JSON，讓使用者在網頁上設定目前科技與目標科技，並即時計算研究成本、研究時間、特殊材料與遊戲頁面實力增幅。

## 目前功能

- 瀏覽 16 個大項科技分支
- 設定目前等級與目標等級
- 彙總糧食、石材、木材、礦石、金幣與研究時間
- 顯示特殊研究材料需求
- 顯示效果摘要與遊戲頁面實力增幅
- 支援繁體中文與 English 介面切換
- 針對科技樹提供接近遊戲內頁面的 top-down 排版
- 可直接輸出靜態網站並部署到 GitHub Pages

## 專案結構

- data/parsed/
  parser 輸出的前端靜態資料，包含字串、效果與科技資料。
- docs/
  反解與資料遷移筆記。
- tools/parser/
  .NET 9 parser，負責把原始科技表轉成 data/parsed 內的 JSON。
- web/
  React + TypeScript + Vite 前端，GitHub Pages 站點內容會由這裡建置。

## 本機開發

### 需求

- Node.js 20+
- npm 10+
- .NET SDK 9.0

### 前端開發

1. 進入 web 目錄。
2. 安裝前端依賴。
3. 啟動開發伺服器。

```bash
cd web
npm ci
npm run dev
```

### 建置靜態頁面

```bash
cd web
npm ci
npm run build
```

輸出會在 web/dist。

### 重新產生解析資料

如果有更新 data/raw 內的原始表，可重新執行 parser：

```bash
dotnet run --project tools/parser/LordsMobileTechTree.Parser.csproj
```

Parser 會把前端需要的資料輸出到 data/parsed。

## GitHub Pages 部署

專案已提供 GitHub Actions workflow，推到 main 後會自動建置 web/dist 並部署到 GitHub Pages。

部署前請確認：

1. GitHub repository 名稱為 LordsMobileTechTree。
2. 如果 repository 名稱不同，請同步修改 web/vite.config.ts 內的 base。
3. 在 GitHub repository 設定中將 Pages source 設為 GitHub Actions。

## 資料與版權注意事項

- data/raw/ 內的原始客戶端表格不需要提交到公開倉庫，root .gitignore 已預設忽略這些檔案。
- 網站實際部署只依賴 data/parsed/ 與 web/。
