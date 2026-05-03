import idautils
import idaapi
import idc
import os
import re

def dump_il2cpp_blacklist_filter():
    # 設定你要輸出的資料夾路徑
    output_dir = r"F:\開發\王國紀元戰鬥模擬器\reverse_engineering\ida\cfile3"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 確認 Hex-Rays 反編譯器是否可用
    if not idaapi.init_hexrays_plugin():
        print("Hex-Rays decompiler is not available. Please check your license.")
        return

    # 【核心修改】設定黑名單前綴 (Blacklist)
    # 這些都是 .NET 底層、Unity 引擎或是 il2cpp 自己的 boilerplate，對分析業務邏輯毫無幫助
    blacklist_prefixes = [
        "UnityEngine_",     # Unity 引擎核心 API
        "System_",          # .NET System 基礎類別 (System.String, System.Collections 等)
        "mscorlib_",        # .NET 核心庫
        "il2cpp_",          # il2cpp 內部的 runtime 函數
        "Mono_",            # Mono 相關底層
        "TMPro_",           # TextMeshPro UI 相關
        "Unity_",           # Unity 其他模組
        "Microsoft_",       # .NET 擴充模組
        "EventSystems_",    # Unity UI 事件系統
    ]

    count = 0
    skipped_count = 0
    print(f"Starting to dump IL2CPP functions (Blacklist Mode) to: {output_dir}")

    # 遍歷所有函數
    for ea in idautils.Functions():
        func_name = idc.get_func_name(ea)
        if not func_name:
            continue

        # 過濾機制：如果函數名稱開頭命中黑名單，直接跳過
        is_blacklisted = any(func_name.startswith(prefix) for prefix in blacklist_prefixes)
        if is_blacklisted:
            skipped_count += 1
            continue

        # 替換掉不合法的檔案名稱字元
        safe_name = re.sub(r'[\\/*?:"<>|]', "_", func_name)
        
        try:
            # 呼叫 F5 反編譯
            cfunc = idaapi.decompile(ea)
            if cfunc:
                code_str = str(cfunc)
                
                # 寫入檔案並避免路徑過長 (Windows MAX_PATH 限制)
                file_path = os.path.join(output_dir, f"{safe_name}.c")
                if len(file_path) > 250:
                    file_path = os.path.join(output_dir, f"sub_{hex(ea)[2:]}.c")
                    
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(code_str)
                count += 1
                
                # 每處理 100 個函數印出一次進度
                if count % 100 == 0:
                    print(f"Dumped {count} functions... (Skipped {skipped_count} base functions)")
                    
        except Exception as e:
            print(f"[-] Error processing {func_name} at {hex(ea)}: {e}")

    print(f"Done! Successfully dumped {count} functions. Skipped {skipped_count} noisy functions.")

if __name__ == "__main__":
    dump_il2cpp_blacklist_filter()

