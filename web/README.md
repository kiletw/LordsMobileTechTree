# Frontend

這個目錄是王國紀元科技樹規劃器的前端站點，使用 React、TypeScript 與 Vite 建置。

目前主要提供：

- 科技樹規劃與前置科技自動補齊
- 研究成本、研究時間、實力與效果摘要
- 特殊研究材料彙總
- UI 與遊戲字串的多語系切換
- GitHub Pages 靜態部署

## 安裝與指令

```bash
npm ci
npm run dev
npm run build
npm run preview
```

## 資料來源

前端不直接讀取 data/raw，而是透過 Vite 的 publicDir 設定載入 ../data/parsed 內的靜態 JSON。

目前前端會讀取的主要資料：

- ../data/parsed/tech/TechData.json
- ../data/parsed/effects/Effect.json
- ../data/parsed/strings/{locale}.json

如果 data/parsed 尚未更新，請先回到專案根目錄重新執行 parser：

```bash
dotnet run --project tools/parser/LordsMobileTechTree.Parser.csproj
```

## 多語系行為

前端目前支援下列 locale：

- zh-TW
- en
- zh-CN
- ja
- ko
- id
- tr
- uk
- ar
- pl

語系初始化順序如下：

1. localStorage 內已儲存的語系
2. 使用者瀏覽器語系
3. 英文 fallback

UI 文案與遊戲 StringTable 會一起切換。若某個 locale 的 UI 文案尚未完整覆蓋，會回退到英文 UI；遊戲字串則會優先讀取對應的 parsed strings 檔案。

## 開發注意事項

- 瀏覽器標題會跟著目前 UI locale 切換。
- 特殊研究材料名稱使用 itemNameKey 對應當前語系遊戲字串，不再固定綁定單一語言。
- 如果新增了 loading 內的 StringTable 語系，記得同步更新 parser 與前端 i18n locale 設定。

## GitHub Pages

目前 Vite base 設為 /LordsMobileTechTree/，設定位置在 [vite.config.ts](vite.config.ts)。如果 GitHub repository 名稱不同，請同步修改這個 base。

正式部署流程由 repo 根目錄下的 GitHub Actions workflow 處理；前端這邊只負責產出靜態站點。

更完整的專案說明、結構與部署流程請看上層的 README.md。
