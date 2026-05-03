# Data Refresh Guide

## 目的
讓專案可以在拿到新版 client 後，重新輸出最新文本與科技資料，而不是只依賴一次性的舊 JSON。

## 最小刷新流程
1. 更新 `data/raw/` 內的 `Tech*` 與 `StringTable*` 檔案。
2. 更新 parser 的 struct 定義。
3. 執行 parser，輸出到 `data/parsed/`。
4. 比對 record count、checksum 與 sample records。
5. 更新 refresh manifest。

## 最小欄位需求
- Tech ID
- Kind 或 category
- Name string ID
- Level 或 level linkage
- Prerequisites
- Resource cost
- Research time
- Power gain
- Effect values
- Icon key 或 icon path

## 不可省略的驗證
- struct size 驗證
- string lookup 驗證
- row count 驗證
- client version 與 checksum 記錄

## 注意
目前 `tools/parser/Program.cs` 還是從舊 repo 直接帶入，後續需要縮成專注處理科技樹所需資料。