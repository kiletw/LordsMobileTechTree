# IDA 逆向工作區

這個資料夾用來集中管理 IDA Pro 逆向結果，避免每次對話重貼函式。

## 結構
- `raw_snippets/`：原始反編譯貼文（盡量不改動）
- `analysis/`：語意化分析、推論、待驗證假說
- `FUNCTION_INDEX.md`：函式索引與狀態追蹤

## 工作手冊
- 純靜態追查流程：`analysis/static_only_workflow.md`

## 使用方式
1. 在 IDA 找到新函式後，將反編譯內容貼到 `raw_snippets/` 新檔。
2. 在 `FUNCTION_INDEX.md` 新增一筆（地址、角色、可信度、下一步）。
3. 在 `analysis/` 更新結論（例如相剋倍率來源、攻城車規則）。

## 目前重點
- 定錨攻城車（Catapults/Siege）克制規則來源。
- 定錨相剋增傷 `1.5` 的實際來源函式/欄位。
- 已知 `0.45/0.6` 來自 `sub_18001AF10` 常數分支。
