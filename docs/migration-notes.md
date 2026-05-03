# Migration Notes

這個專案是從王國紀元戰鬥模擬器 repo 抽出可重用的資料流程與前端結構，目標改為科技樹模擬器。

## 第一批搬入檔案
- `tools/parser/Program.cs`: 來自舊 repo 的 parser 起點，後續會縮成專注處理 StringTable 與 Tech 類表。
- `tools/reverse/dump.py`: IDA Hex-Rays dump 腳本。
- `docs/ida-workflow.md`: 逆向工作手冊基底。
- `web/src/i18n/*`: 前端 i18n 基礎架構。
- `data/raw/*`: Tech 與字串原始 bytes。
- `data/parsed/strings/zh-TW.json`: 既有輸出範例。

## 明確不搬入的內容
- 戰鬥模擬引擎與 replay 驗證工具。
- battle report 與 native validator 工作流。
- 與 CombatEngine 直接耦合的模型與邏輯。

## 後續原則
1. 先完成最新 client 資料盤點與 Tech 表解析。
2. 再建立科技樹 JSON schema 與聚合器。
3. 最後才接上 UI 與 GitHub Pages。