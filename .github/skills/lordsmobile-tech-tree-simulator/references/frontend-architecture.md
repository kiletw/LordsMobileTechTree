# Frontend Architecture Guide

## 基底
目前新專案前端使用 Vite React TypeScript。可直接沿用舊 repo 帶來的 i18n 結構。

## 已搬入基礎
- `web/src/i18n/I18nContext.tsx`
- `web/src/i18n/types.ts`
- `web/src/i18n/locales/zh-TW.ts`
- `web/src/i18n/locales/en.ts`

## 下一步
1. 把 i18n 從原本 API fetch 模式改成靜態資料模式。
2. 新增 tech tree 專用的 UI 字串 keys。
3. 讓科技資料從 `data/parsed/` 轉成前端可載入的 JSON。
4. 再補 GitHub Pages 所需的 `base` 設定與靜態資產路徑。

## 原則
- 第一版不要依賴 backend API。
- 先做靜態 JSON 載入。
- 圖片先使用 `public/` 與相對路徑，之後再處理資產量優化。