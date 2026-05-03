# Frontend

這個目錄是王國紀元科技樹規劃器的前端站點，使用 React、TypeScript 與 Vite 建置。

## 指令

```bash
npm ci
npm run dev
npm run build
npm run preview
```

## 資料來源

前端不直接讀取 data/raw，而是透過 Vite 的 publicDir 設定載入 ../data/parsed 內的靜態 JSON。

## GitHub Pages

目前 Vite base 設為 /LordsMobileTechTree/。如果 GitHub repository 名稱不同，請同步修改 vite.config.ts。

更完整的專案說明、結構與部署流程請看上層的 README.md。
