# Client Extraction Guide

這份 skill 的第一步不是寫畫面，而是先確認新版客戶端的資料來源。

## 盤點目標
- 新版 client 的 `Assembly-CSharp` 或 IL2CPP 輸出
- AssetBundle 或 `.unity3d` 資產
- table bytes，例如 `Tech.bytes`、`TechTree.bytes`
- 文字表 `StringTable.bytes` 與 `StringTable2.bytes`
- icon 或 UI 資產路徑

## 建議流程
1. 確認 client 版本號，建立一份 extraction manifest。
2. 把原始 bytes 放到 `data/raw/`。
3. 若需要重新逆向 struct，先用 `tools/reverse/dump.py` 或 IDA/Ghidra 建立新一輪分析輸出。
4. 不要直接信任舊版欄位位置；新版要重新比對 record size 與字串 ID。

## 輸出要求
- 所有 raw files 保留原始檔名。
- 記錄來源版本、提取日期、檔案 checksum。
- 若有多語 string assets，保留每個 locale 的實際路徑與命名。

## 常見風險
- 新版 client 改了 table 檔名或資料夾層級。
- `buildUP_NEW` 這類變體表可能取代舊表。
- `StringTable` 的索引與主表不可拆開看。