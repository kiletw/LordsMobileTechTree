# Reverse Engineering Guide

## 目標
定出科技樹相關表的 struct size、欄位 offset 與字串 ID 關係。

## 第一批優先表
- `Tech.bytes`
- `TechKind.bytes`
- `TechLv.bytes`
- `TechTree.bytes`
- `buildkind.bytes`
- `buildUP_NEW.bytes`

## 工具
- IDA Pro 或 Ghidra
- `tools/reverse/dump.py`
- `docs/ida-workflow.md`

## 工作規則
1. 先量 record size，再猜欄位，不要反過來。
2. 看到疑似字串欄位時，用 `StringTable` 驗證是否能對到合理名稱。
3. 每找到一個可信 struct，都記錄版本與驗證方式。
4. 不要把 battle simulator 的欄位語意直接套進 Tech 表。

## 驗證方式
- 檔案大小 / record count 是否合理
- string ID 是否存在於 `StringTable`
- 同一表不同版本是否有欄位漂移
- 產出的 JSON 是否能支持科技樹 UI 的最小欄位需求