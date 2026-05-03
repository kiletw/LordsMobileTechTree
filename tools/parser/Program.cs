using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace Parser
{
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct _PetRatio
    {
        public ushort Ratio;
        public ushort UpDownDist;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PetTbl
    {
        public ushort ID;
        public ushort HeroID;
        public ushort Name;
        public byte TexType;
        public byte Rare;
        public ushort MapRatio;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public _PetRatio[] PetRatio;
        public ushort CameraAngle;
        public ushort SoulID;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public ushort[] PetSkill;
        public byte Army;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 6)]
        public ushort[] PetAttr;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 3)]
        public ushort[] EffectRatio;
        public _PetRatio StartupRatio;
        public ushort Tactics;
        public ushort AwakenItem;
        public ushort AwakenItemCount;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 7)]
        public ushort[] Reserve;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PetSkillTbl
    {
        public ushort ID;
        public ushort Name;
        public ushort Icon;
        public ushort Effect1;
        public ushort Effect2;
        public ushort Effect3;
        public ushort Status;
        public byte Type;
        public byte Kind;
        public byte Subject;
        public byte Class;
        public byte UpLevel;
        public ushort Diamond;
        public byte ShowReport;
        public ushort ZValue;
        public ushort XValue;
        public ushort YValue;
        public ushort AValue;
        public ushort BValue;
        public ushort CValue;
        public ushort DValue;
        public ushort CoolDown;
        public ushort Fatigue;
        public ushort Experience;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 9)]
        public byte[] OpenLevel;
        public ushort DamageRange;
        public ushort HitSound;
        public ushort FlyParticle;
        public ushort FlySound;
        public ushort SoundNo;
        public ushort EffectTime;
        public ushort Reserved1;
        public ushort Reserved2;
        public ushort Reserved3;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PetCombatSkillData
    {
        public ushort ID;               // 0
        public ushort Name;             // 2
        public ushort Icon;             // 4
        public ushort Description1;     // 6
        public ushort Description2;     // 8
        public byte EntryPoint;         // 10
        public ushort EP_Value;         // 11
        public byte Target;             // 13
        public byte CalcKind;           // 14
        public ushort DamageAdd;        // 15
        public ushort Buff;             // 17
        public ushort Effect;           // 19
        public ushort Effect2;          // 21
        public ushort Effect3;          // 23
        public ushort BuffCondition;    // 25
        public ushort BuffValue;        // 27
        public ushort BuffValue2;       // 29
        public ushort BuffValue3;       // 31
        public ushort BuffEntry;        // 33
        public byte Upgradable;         // 35
        public ushort UpgradeRequire;   // 36
        public ushort MaxLevel;         // 38
        public ushort MeshScale;        // 40
        public ushort Anim;             // 42
        public byte Appear;             // 44
        public ushort StateIcon;        // 45
        public ushort FireParticle;     // 47
        public ushort FireSound;        // 49
        public ushort HitParticle;      // 51
        public ushort FireSoundDelay;   // 53
        public byte FaceTo;             // 55
        public ushort FlyObjMode;       // 56
        public ushort FlyObjParticle;   // 58
        public ushort SoundPack;        // 60
        public ushort FlyObjSpeed;      // 62
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 6)]
        public ushort[] Reserve;        // 64 (12 bytes)
    }

    // PetCombatSkillValue: 每個 BuffValue/EP_Value/DamageAdd/BuffEntry 參照的等級數值表
    // 結構: ushort ID + int32[10] (Level 1~10 數值) + byte padding = 43 bytes
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct PetCombatSkillValueData
    {
        public ushort ID;               // 0  (2 bytes)
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 10)]
        public int[] Values;            // 2  (40 bytes) - Level 1~10 values
        public byte Padding;            // 42 (1 byte)
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct MagicPowerArmsTbl
    {
        public ushort ID;               // 0
        public ushort GroupID;          // 2
        public byte Rare;               // 4
        public byte Type;               // 5
        public ushort Name;             // 6
        public ushort Description;      // 8
        public ushort Icon;             // 10
        public ushort ItemID;           // 12
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public ushort[] Effects;        // 14 (8 bytes)
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public int[] Values;            // 22 (16 bytes)
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 8)]
        public ushort[] Reserve;        // 38 (16 bytes)
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct HeroAttackInfo
    {
        public ushort AttackType;
        public ushort AttackRange;
        public ushort AttackSpeed;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct HeroTbl
    {
        public ushort HeroKey;          // 0
        public ushort HeroTitle;        // 2
        public ushort HeroName;         // 4
        public byte defaultStar;        // 6
        public byte HeroType;           // 7
        public ushort Description;      // 8
        public ushort Summary;          // 10
        public ushort Graph;            // 12
        public ushort Modle;            // 14
        public ushort Pos;              // 16
        public ushort Radius;           // 18
        public ushort Height;           // 20
        public ushort AI;               // 22
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 3)]
        public ushort[] DefaultAtt;     // 24 (6 bytes)
        public ushort MaxHealth;        // 30
        public ushort AttackDamage;     // 32
        public ushort AbilityPower;     // 34
        public ushort Armor;            // 36
        public ushort MagicResist;      // 38
        public ushort PhysicalCrit;     // 40
        public ushort SpellCrit;        // 42
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 3)]
        public ushort[] StarUp;         // 44 (6 bytes)
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 5)]
        public ushort[] AttackPower;    // 50 (10 bytes)
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 5)]
        public HeroAttackInfo[] HeroAttackInfoArr; // 60 (30 bytes)
        public ushort SoulStone;        // 90
        public byte SoldierKind;        // 92
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public ushort[] GroupSkill;     // 93 (8 bytes)
        public byte TextureNo;          // 101
        public ushort Scale;            // 102
        public ushort HurtSound;        // 104
        public ushort DyingSound;       // 106
        public byte bShowHeroStone;     // 108
        public ushort CameraDistance;   // 109
        public ushort CameraScaleRate;  // 111
        public ushort EnergyAfterKill;  // 113
        public ushort CameraScaleRate_C;// 115
        public ushort Camera_Horizontal;// 117
        public ushort MoveSpeed;        // 119
        public ushort EquipEX;          // 121
        public byte SupportShowType;    // 123
        public ushort AnimationMoveSpeed;// 124
        public ushort CameraXAxis_Prison;// 126
        public ushort HitParticleScaleRate;// 128
        public ushort ResidentEffect;   // 130
        public ushort ParticlePackNo;   // 132
        public ushort AudioPackNo;      // 134
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct SoldierTbl
    {
        public ushort SoldierKey;       // 0
        public byte Kind;               // 2
        public ushort Name;             // 3
        public ushort Icon;             // 5
        public ushort Model;            // 7
        public ushort Caption;          // 9
        public byte SoldierKind;        // 11
        public byte Tier;               // 12
        public ushort Attack;           // 13
        public ushort Defence;          // 15
        public ushort MaxHp;            // 17
        public ushort Speed;            // 19
        public byte Traffic;            // 21
        public byte Strength;           // 22
        public byte Salaries;           // 23
        public ushort Radius;           // 24
        public ushort Skill;            // 26
        public ushort FoodRequire;      // 28
        public ushort StoneRequire;     // 30
        public ushort WoodRequire;      // 32
        public ushort IronRequire;      // 34
        public ushort MoneyRequire;     // 36
        public ushort TimeRequire;      // 38
        public ushort Science;          // 40
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct BuffTbl
    {
        public ushort BuffKey;          // 0
        public byte StateBehavior;      // 2
        public byte EffectNumber;       // 3
        public ushort Length;           // 4
        public ushort StepTime;         // 6
        public byte SpecialEffects;     // 8
        public ushort SpecialEffectValue; // 9
        public byte ReplaceGroups;      // 11
        public byte ReplaceOrder;       // 12
        public ushort Particle;         // 13
        public byte ParticlePos;        // 15
        public ushort HitParticle;      // 16
        public byte ColorModify;        // 18
        public byte FaceCamera;         // 19
    }

    [StructLayout(LayoutKind.Explicit, Size = 78)]
    public struct SkillTbl
    {
        [FieldOffset(0)] public ushort SkillKey;
        [FieldOffset(2)] public ushort SkillName;
        [FieldOffset(4)] public ushort SkillIcon;
        [FieldOffset(6)] public ushort Describe;
        [FieldOffset(8)] public ushort ValueInfo;
        [FieldOffset(10)] public byte SkillType;
        [FieldOffset(11)] public byte SkillKind;
        [FieldOffset(12)] public ushort CoolDown;
        [FieldOffset(14)] public byte InFightingCD;
        [FieldOffset(15)] public ushort SkillDistance;
        [FieldOffset(17)] public byte HurtKind;
        [FieldOffset(18)] public ushort HurtAddition;
        [FieldOffset(20)] public ushort HurtValue;
        [FieldOffset(22)] public ushort HurtIncreaseValue;
        [FieldOffset(24)] public ushort Rangeparameter1;
        [FieldOffset(26)] public ushort Rangeparameter2;
        [FieldOffset(28)] public ushort TargetState;
        [FieldOffset(30)] public ushort SelfState;
        [FieldOffset(32)] public ushort StateAddition;
        [FieldOffset(34)] public ushort StateValue;
        [FieldOffset(36)] public ushort StateIncreaseValue;
        [FieldOffset(38)] public ushort PreFireParticle;
        [FieldOffset(40)] public byte PreFireParticlePos;
        [FieldOffset(41)] public ushort FireParticle;
        [FieldOffset(43)] public byte FireParticlePos;
        [FieldOffset(44)] public ushort FireVocalDelay;
        [FieldOffset(46)] public ushort FireVocal;
        [FieldOffset(48)] public ushort FireSoundDelay;
        [FieldOffset(50)] public ushort FireSound;
        [FieldOffset(52)] public ushort UltraHitSound;
        [FieldOffset(54)] public ushort HitParticle;
        [FieldOffset(56)] public byte HitParticlePos;
        [FieldOffset(57)] public ushort RangeHitParticle;
        [FieldOffset(59)] public ushort HitSound;
        [FieldOffset(61)] ushort UltraParticle;
        [FieldOffset(63)] public byte UltraParticlePos;
        [FieldOffset(64)] public ushort UltraSound;
        [FieldOffset(66)] public byte FlyTarget;
        [FieldOffset(67)] public byte FlyType;
        [FieldOffset(68)] public ushort FlyParticle;
        [FieldOffset(70)] public ushort FlySound;
        [FieldOffset(72)] public ushort FlyRate;
        [FieldOffset(74)] public byte IsShake;
        [FieldOffset(75)] public byte WorkingAI;
        [FieldOffset(76)] public ushort RecvEnergy;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct Properties
    {
        public ushort Propertieskey;    // 0
        public ushort PropertiesValue;  // 2
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct Synthetic
    {
        public ushort SyntheticItem;    // 0
        public byte SyntheticItemNum;   // 2
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct ItemTbl
    {
        public ushort EquipKey;         // 0
        public ushort EquipName;        // 2
        public byte Color;              // 4
        public byte NeedLv;             // 5
        public ushort EquipInfo;        // 6
        public ushort EquipPicture;     // 8
        public uint RecoverPrice;       // 10
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 6)]
        public Properties[] PropertiesInfo; // 14 (24 bytes)
        public byte EquipKind;          // 38
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public Synthetic[] SyntheticParts; // 39 (12 bytes)
        public uint MixPrice;           // 51
        public uint MixTime;            // 55
        public uint ForgingExp;         // 59
        public byte Hide;               // 63
        public byte ActivitySuitIndex;  // 64
        public uint TimedTime;          // 65
        public byte TimedType;          // 69
        public byte NewGem;             // 70
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public ushort[] NewGemEffect;   // 71 (8 bytes)
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 9)]
        public byte[] Reserve;          // 79 (9 bytes)
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct EffectTbl
    {
        public ushort ID;               // 0
        public ushort Name;             // 2
        public ushort Description;      // 4
        public ushort Icon;             // 6
        public byte Type;               // 8
        public byte Target;             // 9
        public ushort Value;            // 10
        public ushort Reserved;         // 12
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechTbl
    {
        public ushort ID;               // 0
        public byte KindID;             // 2
        public ushort Name;             // 3
        public byte TreeID;             // 5
        public byte Reserved;           // 6
        public byte MaxLevel;           // 7
        public ushort Tail;             // 8
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechSpTbl
    {
        public ushort ID;               // 0
        public byte KindID;             // 2
        public ushort Name;             // 3
        public byte TreeID;             // 5
        public byte Reserved;           // 6
        public byte MaxLevel;           // 7
        public ushort Tail;             // 8
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
        public byte[] Extra;            // 10
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechKindTbl
    {
        public ushort ID;               // 0
        public ushort Name;             // 2
        public ushort SortOrder;        // 4
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechKindSp2Tbl
    {
        public ushort ID;               // 0
        public ushort Name;             // 2
        public byte LegacySortOrder;    // 4
        public byte DisplayOrder;       // 5
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 28)]
        public byte[] Extra;            // 6
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechRequirementTbl
    {
        public ushort TechID;           // 0
        public byte Level;              // 2
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechLvTbl
    {
        public ushort RowID;            // 0
        public ushort TechID;           // 2
        public byte Level;              // 4
        public uint Food;               // 5
        public uint Stone;              // 9
        public uint Wood;               // 13
        public uint Iron;               // 17
        public uint Gold;               // 21
        public uint TimeSeconds;        // 25
        public byte RequiredAcademyLevel; // 29
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
        public TechRequirementTbl[] Prerequisites; // 30 (12 bytes)
        public uint EffectValue;        // 42
        public ushort EffectID;         // 46
        public uint PowerGain;          // 48
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechTreeRawTbl
    {
        public ushort ID;               // 0
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 19)]
        public byte[] RawData;          // 2
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TechLvSp2RawTbl
    {
        public ushort RowID;            // 0
        public ushort TechID;           // 2
        public byte Level;              // 4
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 28)]
        public byte[] RawData;          // 5
    }

    class Program
    {
        // 遊戲語言 → StringTable 資產名稱的對應 (與 AssetManager.StringAsset 一致)
        static readonly (string locale, string assetName)[] GameLocales = new[]
        {
            ("en",    "StringEng"),
            ("zh-TW", "StringCht"),
            ("fr",    "StringFre"),
            ("de",    "StringGem"),
            ("es",    "StringSpa"),
            ("ru",    "StringRus"),
            ("zh-CN", "StringChs"),
            ("id",    "StringIdn"),
            ("vi",    "StringVet"),
            ("tr",    "StringTur"),
            ("th",    "StringTha"),
            ("it",    "StringIta"),
            ("pt",    "StringPot"),
            ("ko",    "StringKor"),
            ("ja",    "StringJap"),
            ("uk",    "StringUkr"),
            ("ms",    "StringMys"),
            ("ar",    "StringArb"),
        };

        static readonly string[] TechProbeTableFiles = new[]
        {
            "Tech.bytes",
            "TechKind.bytes",
            "TechLv.bytes",
            "TechTree.bytes",
            "TechRecommendation.bytes",
            "TechSp.bytes",
            "TechKindSp.bytes",
            "TechKindSp2.bytes",
            "TechLvSp.bytes",
            "TechLvSp2.bytes",
            "TechTreeSp.bytes",
        };

        static void Main(string[] args)
        {
            string projectRoot = ResolveProjectRoot(args);
            string tablesPath = Path.Combine(projectRoot, "data", "raw", "assets", "tables");
            string loadingPath = Path.Combine(projectRoot, "data", "raw", "assets", "loading");
            string jsonPath = Path.Combine(projectRoot, "data", "parsed") + Path.DirectorySeparatorChar;

            Directory.CreateDirectory(jsonPath);

            Console.WriteLine($"Project root: {projectRoot}");
            Console.WriteLine($"Tables path: {tablesPath}");
            Console.WriteLine($"Loading path: {loadingPath}");
            Console.WriteLine($"Output path: {jsonPath}");

            if (!TryResolveStringTablePaths(loadingPath, "zh-TW", "StringCht", out var defaultStringPath1, out var defaultStringPath2))
            {
                throw new FileNotFoundException($"Default zh-TW string table not found under {loadingPath}");
            }

            string TablePath(string fileName) => ResolveTablePath(tablesPath, fileName);
            
            // 1. Parse StringTable (預設語言)
            var strings = ParseStringTable(defaultStringPath1, defaultStringPath2);
            
            // 1b. 輸出所有語言的 StringTable
            ExportAllLocaleStringTables(loadingPath, jsonPath, strings);

            // 1c. 輸出 Tech 類表探勘資訊，先縮小 struct layout 範圍
            ExportTechTableProbes(tablesPath, jsonPath);

            // 1d. 輸出科技樹 MVP 資料契約
            ExportTechData(tablesPath, jsonPath, strings);
            
            // 2. Parse Pet.bytes
            var pets = ParseTable<PetTbl>(TablePath("Pet.bytes"));
            
            // 2b. Parse PetCombatSkill.bytes
            var combatSkills = ParseTable<PetCombatSkillData>(TablePath("PetCombatSkill.bytes"));
            var combatSkillMap = new Dictionary<ushort, PetCombatSkillData>();
            foreach (var cs in combatSkills) combatSkillMap[cs.ID] = cs;
            
            var combatSkillList = new List<object>();
            foreach (var cs in combatSkills) {
                strings.TryGetValue(cs.Name, out string nameStr);
                strings.TryGetValue(cs.Description1, out string desc1Str);
                strings.TryGetValue(cs.Description2, out string desc2Str);
                combatSkillList.Add(new {
                    ID = cs.ID,
                    NameID = cs.Name,
                    Name = nameStr,
                    Icon = cs.Icon,
                    Description1ID = cs.Description1,
                    Description1 = desc1Str,
                    Description2ID = cs.Description2,
                    Description2 = desc2Str,
                    EntryPoint = cs.EntryPoint,
                    EP_Value = cs.EP_Value,
                    Target = cs.Target,
                    CalcKind = cs.CalcKind,
                    DamageAdd = cs.DamageAdd,
                    Buff = cs.Buff,
                    Effect = cs.Effect,
                    Effect2 = cs.Effect2,
                    Effect3 = cs.Effect3,
                    BuffCondition = cs.BuffCondition,
                    BuffValue = cs.BuffValue,
                    BuffValue2 = cs.BuffValue2,
                    BuffValue3 = cs.BuffValue3,
                    BuffEntry = cs.BuffEntry,
                    Upgradable = cs.Upgradable,
                    UpgradeRequire = cs.UpgradeRequire,
                    MaxLevel = cs.MaxLevel,
                    MeshScale = cs.MeshScale,
                    Anim = cs.Anim,
                    Appear = cs.Appear,
                    StateIcon = cs.StateIcon,
                    FireParticle = cs.FireParticle,
                    FireSound = cs.FireSound,
                    HitParticle = cs.HitParticle,
                    FireSoundDelay = cs.FireSoundDelay,
                    FaceTo = cs.FaceTo,
                    FlyObjMode = cs.FlyObjMode,
                    FlyObjParticle = cs.FlyObjParticle,
                    SoundPack = cs.SoundPack,
                    FlyObjSpeed = cs.FlyObjSpeed
                });
            }
            File.WriteAllText(jsonPath + "PetCombatSkill.json", JsonSerializer.Serialize(combatSkillList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {combatSkills.Count} pet combat skills.");

            // 2c. Parse PetCombatSkillValue.bytes (等級數值表)
            var skillValues = ParseTable<PetCombatSkillValueData>(TablePath("PetCombatSkillValue.bytes"));
            var skillValueList = new List<object>();
            foreach (var sv in skillValues) {
                skillValueList.Add(new {
                    ID = sv.ID,
                    Values = sv.Values ?? new int[10]
                });
            }
            File.WriteAllText(jsonPath + "PetCombatSkillValue.json", JsonSerializer.Serialize(skillValueList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {skillValues.Count} pet combat skill values.");
            
            var petList = new List<object>();
            foreach(var pet in pets) {
                strings.TryGetValue(pet.Name, out string nameStr);
                string combatSkillName = null;
                if (pet.Tactics > 0 && combatSkillMap.TryGetValue(pet.Tactics, out var tacticsSkill)) {
                    strings.TryGetValue(tacticsSkill.Name, out combatSkillName);
                }
                petList.Add(new {
                    ID = pet.ID,
                    HeroID = pet.HeroID,
                    NameID = pet.Name,
                    Name = nameStr,
                    Rare = pet.Rare,
                    PetSkill = pet.PetSkill,
                    Tactics = pet.Tactics,
                    TacticsSkillName = combatSkillName,
                    AwakenItem = pet.AwakenItem,
                    AwakenItemCount = pet.AwakenItemCount
                });
            }
            File.WriteAllText(jsonPath + "Pet.json", JsonSerializer.Serialize(petList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {pets.Count} pets.");

            // 3. Parse PetSkill.bytes
            var petSkills = ParseTable<PetSkillTbl>(TablePath("PetSkill.bytes"));
            var skillList = new List<object>();
            foreach(var skill in petSkills) {
                strings.TryGetValue(skill.Name, out string nameStr);
                skillList.Add(new {
                    ID = skill.ID,
                    NameID = skill.Name,
                    Name = nameStr,
                    Icon = skill.Icon,
                    Type = skill.Type,
                    Kind = skill.Kind,
                    Subject = skill.Subject,
                    Class = skill.Class
                });
            }
            File.WriteAllText(jsonPath + "PetSkill.json", JsonSerializer.Serialize(skillList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {petSkills.Count} pet skills.");

            var heroes = ParseTable<HeroTbl>(TablePath("Heros.bytes"));
            var heroList = new List<object>();
            foreach(var hero in heroes) {
                strings.TryGetValue(hero.HeroName, out string nameStr);
                strings.TryGetValue(hero.HeroTitle, out string titleStr);
                strings.TryGetValue(hero.Description, out string descStr);
                heroList.Add(new {
                    HeroKey = hero.HeroKey,
                    HeroTitleID = hero.HeroTitle,
                    HeroTitle = titleStr,
                    HeroNameID = hero.HeroName,
                    HeroName = nameStr,
                    defaultStar = hero.defaultStar,
                    HeroType = hero.HeroType,
                    DescriptionID = hero.Description,
                    Description = descStr,
                    Summary = hero.Summary,
                    Graph = hero.Graph,
                    Model = hero.Modle,
                    Pos = hero.Pos,
                    Radius = hero.Radius,
                    Height = hero.Height,
                    AI = hero.AI,
                    DefaultAtt = hero.DefaultAtt,
                    MaxHealth = hero.MaxHealth,
                    AttackDamage = hero.AttackDamage,
                    AbilityPower = hero.AbilityPower,
                    Armor = hero.Armor,
                    MagicResist = hero.MagicResist,
                    PhysicalCrit = hero.PhysicalCrit,
                    SpellCrit = hero.SpellCrit,
                    StarUp = hero.StarUp,
                    AttackPower = hero.AttackPower,
                    HeroAttackInfo = hero.HeroAttackInfoArr?.Select(a => new { a.AttackType, a.AttackRange, a.AttackSpeed }).ToArray(),
                    SoulStone = hero.SoulStone,
                    SoldierKind = hero.SoldierKind,
                    GroupSkill = hero.GroupSkill,
                    TextureNo = hero.TextureNo,
                    Scale = hero.Scale,
                    HurtSound = hero.HurtSound,
                    DyingSound = hero.DyingSound,
                    bShowHeroStone = hero.bShowHeroStone,
                    CameraDistance = hero.CameraDistance,
                    CameraScaleRate = hero.CameraScaleRate,
                    EnergyAfterKill = hero.EnergyAfterKill,
                    MoveSpeed = hero.MoveSpeed,
                    EquipEX = hero.EquipEX,
                    SupportShowType = hero.SupportShowType,
                    AnimationMoveSpeed = hero.AnimationMoveSpeed
                });
            }
            File.WriteAllText(jsonPath + "Hero.json", JsonSerializer.Serialize(heroList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {heroes.Count} heroes.");
            
            var skills = ParseTable<SkillTbl>(TablePath("Skills.bytes"));
            var skillTableList = new List<object>();
            foreach (var s in skills)
            {
                strings.TryGetValue(s.SkillName, out string nameStr);
                skillTableList.Add(new
                {
                    SkillKey = s.SkillKey,
                    SkillNameID = s.SkillName,
                    SkillName = nameStr,
                    DescribeID = s.Describe,
                    ValueInfoID = s.ValueInfo,
                    SkillType = s.SkillType,
                    SkillKind = s.SkillKind,
                    CoolDown = s.CoolDown,
                    InFightingCD = s.InFightingCD,
                    SkillDistance = s.SkillDistance,
                    HurtKind = s.HurtKind,
                    HurtAddition = s.HurtAddition,
                    HurtValue = s.HurtValue,
                    HurtIncreaseValue = s.HurtIncreaseValue,
                    Rangeparameter1 = s.Rangeparameter1,
                    Rangeparameter2 = s.Rangeparameter2,
                    TargetState = s.TargetState,
                    SelfState = s.SelfState,
                    StateAddition = s.StateAddition,
                    StateValue = s.StateValue,
                    StateIncreaseValue = s.StateIncreaseValue,
                    FlyTarget = s.FlyTarget,
                    FlyType = s.FlyType,
                    FlyParticle = s.FlyParticle,
                    FlySound = s.FlySound,
                    FlyRate = s.FlyRate,
                    IsShake = s.IsShake,
                    WorkingAI = s.WorkingAI,
                    RecvEnergy = s.RecvEnergy
                });
            }
            File.WriteAllText(jsonPath + "Skill.json", JsonSerializer.Serialize(skillTableList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {skills.Count} skills.");
            // 6. Parse MagicPowerArms.bytes
            var magicPowerArms = ParseTable<MagicPowerArmsTbl>(TablePath("MagicPowerArms.bytes"));
            var magicPowerArmsList = new List<object>();
            foreach (var m in magicPowerArms)
            {
                strings.TryGetValue(m.Name, out string nameStr);
                strings.TryGetValue(m.Description, out string descStr);
                magicPowerArmsList.Add(new
                {
                    ID = m.ID,
                    GroupID = m.GroupID,
                    Rare = m.Rare,
                    Type = m.Type,
                    NameID = m.Name,
                    Name = nameStr,
                    DescriptionID = m.Description,
                    Description = descStr,
                    Icon = m.Icon,
                    ItemID = m.ItemID,
                    Effects = m.Effects,
                    Values = m.Values
                });
            }
            File.WriteAllText(jsonPath + "MagicPowerArms.json", JsonSerializer.Serialize(magicPowerArmsList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {magicPowerArms.Count} magic power arms.");

            // 7. Parse Soldier.bytes
            var soldiers = ParseTable<SoldierTbl>(TablePath("Soldier.bytes"));
            var soldierList = new List<object>();
            foreach (var s in soldiers)
            {
                strings.TryGetValue(s.Name, out string nameStr);
                strings.TryGetValue(s.Caption, out string captionStr);
                soldierList.Add(new
                {
                    SoldierKey = (int)s.SoldierKey,
                    Kind = (int)s.Kind,
                    NameID = s.Name,
                    Name = nameStr,
                    Icon = (int)s.Icon,
                    Model = (int)s.Model,
                    CaptionID = s.Caption,
                    Caption = captionStr,
                    SoldierKind = (int)s.SoldierKind,
                    Tier = (int)s.Tier,
                    Attack = (int)s.Attack,
                    Defence = (int)s.Defence,
                    MaxHp = (int)s.MaxHp,
                    Speed = (int)s.Speed,
                    Traffic = (int)s.Traffic,
                    Strength = (int)s.Strength,
                    Salaries = (int)s.Salaries,
                    Radius = (int)s.Radius,
                    Skill = (int)s.Skill,
                    FoodRequire = (int)s.FoodRequire,
                    StoneRequire = (int)s.StoneRequire,
                    WoodRequire = (int)s.WoodRequire,
                    IronRequire = (int)s.IronRequire,
                    MoneyRequire = (int)s.MoneyRequire,
                    TimeRequire = (int)s.TimeRequire,
                    Science = (int)s.Science
                });
            }
            File.WriteAllText(jsonPath + "Soldier.json", JsonSerializer.Serialize(soldierList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {soldiers.Count} soldiers.");

            // 8. Parse Buff.bytes
            var buffs = ParseTable<BuffTbl>(TablePath("Buff.bytes"));
            var buffList = new List<object>();
            foreach (var b in buffs)
            {
                buffList.Add(new
                {
                    BuffKey = (int)b.BuffKey,
                    StateBehavior = (int)b.StateBehavior,
                    EffectNumber = (int)b.EffectNumber,
                    Length = (int)b.Length,
                    StepTime = (int)b.StepTime,
                    SpecialEffects = (int)b.SpecialEffects,
                    SpecialEffectValue = (int)b.SpecialEffectValue,
                    ReplaceGroups = (int)b.ReplaceGroups,
                    ReplaceOrder = (int)b.ReplaceOrder,
                    Particle = (int)b.Particle,
                    ParticlePos = (int)b.ParticlePos,
                    HitParticle = (int)b.HitParticle,
                    ColorModify = (int)b.ColorModify,
                    FaceCamera = (int)b.FaceCamera
                });
            }
            File.WriteAllText(jsonPath + "Buff.json", JsonSerializer.Serialize(buffList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {buffs.Count} buffs.");

            // 9. Parse Effect.bytes
            var effects = ParseTable<EffectTbl>(TablePath("Effect.bytes"));
            var effectList = new List<object>();
            foreach (var e in effects)
            {
                strings.TryGetValue(e.Name, out string nameStr);
                strings.TryGetValue(e.Description, out string descStr);
                effectList.Add(new
                {
                    ID = (int)e.ID,
                    NameID = (int)e.Name,
                    Name = nameStr,
                    DescriptionID = (int)e.Description,
                    Description = descStr,
                    Icon = (int)e.Icon,
                    Type = (int)e.Type,
                    Target = (int)e.Target,
                    Value = (int)e.Value
                });
            }
            File.WriteAllText(jsonPath + "Effect.json", JsonSerializer.Serialize(effectList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {effects.Count} effects.");

            // 10. Parse Item.bytes
            var items = ParseTable<ItemTbl>(TablePath("Item.bytes"));
            var itemList = new List<object>();
            foreach (var item in items)
            {
                strings.TryGetValue(item.EquipName, out string nameStr);
                strings.TryGetValue(item.EquipInfo, out string infoStr);
                itemList.Add(new
                {
                    EquipKey = item.EquipKey,
                    EquipNameID = item.EquipName,
                    EquipName = nameStr,
                    Color = item.Color,
                    NeedLv = item.NeedLv,
                    EquipInfoID = item.EquipInfo,
                    EquipInfo = infoStr,
                    EquipPicture = item.EquipPicture,
                    RecoverPrice = item.RecoverPrice,
                    PropertiesInfo = item.PropertiesInfo?.Select(p => new { p.Propertieskey, p.PropertiesValue }).ToArray(),
                    EquipKind = item.EquipKind,
                    SyntheticParts = item.SyntheticParts?.Select(s => new { s.SyntheticItem, s.SyntheticItemNum }).ToArray(),
                    MixPrice = item.MixPrice,
                    MixTime = item.MixTime,
                    ForgingExp = item.ForgingExp,
                    Hide = item.Hide,
                    ActivitySuitIndex = item.ActivitySuitIndex,
                    TimedTime = item.TimedTime,
                    TimedType = item.TimedType,
                    NewGem = item.NewGem,
                    NewGemEffect = item.NewGemEffect,
                    Reserve = item.Reserve
                });
            }
            File.WriteAllText(jsonPath + "Item.json", JsonSerializer.Serialize(itemList, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
            Console.WriteLine($"Parsed {items.Count} items.");
            
        }

        /// <summary>
        /// 匯出所有語言的 StringTable。
        /// 遊戲的每種語言有各自的 StringTable.bytes / StringTable2.bytes，
        /// 存放在各語言子目錄下 (如 Bytes/StringEng/, Bytes/StringCht/)。
        /// 如果該語言的 bytes 不存在，就使用預設字串表 (通常是繁中)。
        /// 
        /// 輸出結構：Json/strings/{locale}.json，鍵為 string ID，值為文字。
        /// </summary>
        static void ExportAllLocaleStringTables(string loadingPath, string jsonPath, Dictionary<ushort, string> defaultStrings)
        {
            var jsonOpt = new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
            string stringsDir = Path.Combine(jsonPath, "strings");
            Directory.CreateDirectory(stringsDir);

            // 先寫出預設語言 (即目前 StringTable.bytes 的內容 — 繁中)
            var defaultDict = new SortedDictionary<string, string>();
            foreach (var kv in defaultStrings)
                defaultDict[kv.Key.ToString()] = kv.Value;

            File.WriteAllText(Path.Combine(stringsDir, "zh-TW.json"), JsonSerializer.Serialize(defaultDict, jsonOpt));
            Console.WriteLine($"Exported default string table as zh-TW.json ({defaultDict.Count} entries)");

            // 嘗試解析各語言的 StringTable
            foreach (var (locale, assetName) in GameLocales)
            {
                if (locale == "zh-TW") continue; // 已寫出

                if (TryResolveStringTablePaths(loadingPath, locale, assetName, out var path1, out var path2))
                {
                    var localeStrings = ParseStringTable(path1, path2);
                    var dict = new SortedDictionary<string, string>();
                    foreach (var kv in localeStrings)
                        dict[kv.Key.ToString()] = kv.Value;

                    File.WriteAllText(Path.Combine(stringsDir, $"{locale}.json"), JsonSerializer.Serialize(dict, jsonOpt));
                    Console.WriteLine($"Exported {locale} string table ({dict.Count} entries) from {assetName}");
                }
                else
                {
                    Console.WriteLine($"Skipped {locale}: {assetName} bytes not found under {loadingPath}");
                }
            }
        }

        static string ResolveProjectRoot(string[] args)
        {
            if (args.Length > 0 && Directory.Exists(args[0]))
            {
                return Path.GetFullPath(args[0]);
            }

            var current = new DirectoryInfo(AppContext.BaseDirectory);
            while (current is not null)
            {
                if (File.Exists(Path.Combine(current.FullName, "LordsMobileTechTree.sln")))
                {
                    return current.FullName;
                }

                current = current.Parent;
            }

            throw new DirectoryNotFoundException("Could not locate project root from parser executable directory.");
        }

        static string ResolveTablePath(string tablesPath, string fileName)
        {
            string directPath = Path.Combine(tablesPath, fileName);
            if (File.Exists(directPath))
            {
                return directPath;
            }

            string stem = Path.GetFileNameWithoutExtension(fileName);
            string extension = Path.GetExtension(fileName);
            string nestedPath = Path.Combine(tablesPath, stem.ToLowerInvariant(), fileName);
            if (File.Exists(nestedPath))
            {
                return nestedPath;
            }

            string nestedLowerFilePath = Path.Combine(tablesPath, stem.ToLowerInvariant(), stem.ToLowerInvariant() + extension);
            if (File.Exists(nestedLowerFilePath))
            {
                return nestedLowerFilePath;
            }

            return directPath;
        }

        static string ResolvePreferredTablePath(string tablesPath, params string[] fileNames)
        {
            foreach (var fileName in fileNames)
            {
                string candidate = ResolveTablePath(tablesPath, fileName);
                if (File.Exists(candidate))
                {
                    return candidate;
                }
            }

            return ResolveTablePath(tablesPath, fileNames[0]);
        }

        static bool TryResolveStringTablePaths(string loadingPath, string locale, string assetName, out string path1, out string path2)
        {
            var candidates = new (string path1, string path2)[]
            {
                (
                    Path.Combine(loadingPath, assetName, "StringTable.bytes"),
                    Path.Combine(loadingPath, assetName, "StringTable2.bytes")
                ),
                (
                    Path.Combine(loadingPath, assetName.ToLowerInvariant(), "StringTable.bytes"),
                    Path.Combine(loadingPath, assetName.ToLowerInvariant(), "StringTable2.bytes")
                ),
                (
                    Path.Combine(loadingPath, assetName.ToLowerInvariant(), "stringtable", "StringTable.bytes"),
                    Path.Combine(loadingPath, assetName.ToLowerInvariant(), "stringtable2", "StringTable2.bytes")
                ),
                (
                    Path.Combine(loadingPath, locale.ToLowerInvariant(), "stringtable", "StringTable.bytes"),
                    Path.Combine(loadingPath, locale.ToLowerInvariant(), "stringtable2", "StringTable2.bytes")
                )
            };

            foreach (var candidate in candidates)
            {
                if (File.Exists(candidate.path1) && File.Exists(candidate.path2))
                {
                    path1 = candidate.path1;
                    path2 = candidate.path2;
                    return true;
                }
            }

            path1 = string.Empty;
            path2 = string.Empty;
            return false;
        }

        static void ExportTechTableProbes(string tablesPath, string jsonPath)
        {
            var jsonOpt = new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
            string techDir = Path.Combine(jsonPath, "tech");
            Directory.CreateDirectory(techDir);

            var probes = new List<object>();
            foreach (var fileName in TechProbeTableFiles)
            {
                string resolvedPath = ResolveTablePath(tablesPath, fileName);
                probes.Add(BuildTableProbe(fileName, resolvedPath));
            }

            File.WriteAllText(Path.Combine(techDir, "TechTableProbe.json"), JsonSerializer.Serialize(probes, jsonOpt));
            Console.WriteLine($"Exported {probes.Count} tech table probes.");
        }

        static void ExportTechData(string tablesPath, string jsonPath, Dictionary<ushort, string> strings)
        {
            var jsonOpt = new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
            string techDir = Path.Combine(jsonPath, "tech");
            Directory.CreateDirectory(techDir);

            string kindCatalogPath = ResolvePreferredTablePath(tablesPath, "TechKindSp2.bytes", "TechKind.bytes");
            string techCatalogPath = ResolvePreferredTablePath(tablesPath, "TechSp.bytes", "Tech.bytes");
            string treeCatalogPath = ResolvePreferredTablePath(tablesPath, "TechTreeSp.bytes", "TechTree.bytes");

            var techKinds = new List<(ushort Id, ushort NameKey, int SortOrder)>();
            if (Path.GetFileName(kindCatalogPath).Equals("TechKindSp2.bytes", StringComparison.OrdinalIgnoreCase))
            {
                techKinds = ParseTable<TechKindSp2Tbl>(kindCatalogPath)
                    .Select((kind, index) => (
                        kind.ID,
                        kind.Name,
                        kind.DisplayOrder > 0 ? (int)kind.DisplayOrder : index + 1
                    ))
                    .ToList();
            }
            else
            {
                techKinds = ParseTable<TechKindTbl>(kindCatalogPath)
                    .Select(kind => (kind.ID, kind.Name, (int)kind.SortOrder))
                    .ToList();
            }

            var techs = new List<(ushort Id, byte KindId, ushort NameKey, byte TreeId, byte MaxLevel)>();
            if (Path.GetFileName(techCatalogPath).Equals("TechSp.bytes", StringComparison.OrdinalIgnoreCase))
            {
                techs = ParseTable<TechSpTbl>(techCatalogPath)
                    .Select(tech => (tech.ID, tech.KindID, tech.Name, tech.TreeID, tech.MaxLevel))
                    .ToList();
            }
            else
            {
                techs = ParseTable<TechTbl>(techCatalogPath)
                    .Select(tech => (tech.ID, tech.KindID, tech.Name, tech.TreeID, tech.MaxLevel))
                    .ToList();
            }

            var techLevels = ParseTable<TechLvTbl>(ResolveTablePath(tablesPath, "TechLv.bytes"));
            var itemNameById = ParseTable<ItemTbl>(ResolveTablePath(tablesPath, "Item.bytes"))
                .ToDictionary(item => item.EquipKey, item => LookupString(strings, item.EquipName));
            var specialResearchCostByTechLevel = BuildSpecialResearchCostLookup(tablesPath, itemNameById.Keys);
            var supplementalLevelCounts = ParseTable<TechLvSp2RawTbl>(ResolveTablePath(tablesPath, "TechLvSp2.bytes"))
                .GroupBy(level => level.TechID)
                .ToDictionary(group => group.Key, group => group.Count());
            var techTreeNodes = ParseTable<TechTreeRawTbl>(treeCatalogPath);

            var kindById = techKinds.ToDictionary(kind => kind.Id);
            var levelsByTech = techLevels
                .GroupBy(level => level.TechID)
                .ToDictionary(group => group.Key, group => group.OrderBy(level => level.Level).ToList());

            var techData = new
            {
                version = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                catalog = new
                {
                    kindTable = Path.GetFileName(kindCatalogPath),
                    techTable = Path.GetFileName(techCatalogPath),
                    treeTable = Path.GetFileName(treeCatalogPath),
                },
                kinds = techKinds
                    .OrderBy(kind => kind.SortOrder)
                    .ThenBy(kind => kind.Id)
                    .Select(kind => new
                    {
                        id = kind.Id,
                        nameKey = kind.NameKey,
                        name = LookupString(strings, kind.NameKey),
                        sortOrder = kind.SortOrder,
                    })
                    .ToArray(),
                treeNodes = techTreeNodes
                    .Select(node => new
                    {
                        id = node.ID,
                        rawBytesHex = Convert.ToHexString(node.RawData ?? Array.Empty<byte>()),
                    })
                    .ToArray(),
                techs = techs
                    .OrderBy(tech => tech.KindId)
                    .ThenBy(tech => tech.TreeId)
                    .ThenBy(tech => tech.Id)
                    .Select(tech =>
                    {
                        kindById.TryGetValue(tech.KindId, out var kind);
                        levelsByTech.TryGetValue(tech.Id, out var levels);
                        supplementalLevelCounts.TryGetValue(tech.Id, out var supplementalLevelCount);
                        bool plannerSupported = levels is { Count: > 0 };

                        return new
                        {
                            id = tech.Id,
                            kindId = tech.KindId,
                            kindNameKey = kind.NameKey,
                            nameKey = tech.NameKey,
                            name = LookupString(strings, tech.NameKey),
                            treeNodeId = tech.TreeId,
                            maxLevel = tech.MaxLevel,
                            plannerSupported,
                            supplementalLevelCount,
                            dataStatus = plannerSupported ? "full" : supplementalLevelCount > 0 ? "supplemental-only" : "missing",
                            levels = (levels ?? new List<TechLvTbl>())
                                .Select(level => new
                                {
                                    specialCosts = BuildSpecialResearchCostExport(
                                        specialResearchCostByTechLevel,
                                        itemNameById,
                                        tech.Id,
                                        level.Level),
                                    rowId = level.RowID,
                                    level = level.Level,
                                    academyLevel = level.RequiredAcademyLevel,
                                    cost = new
                                    {
                                        food = level.Food,
                                        stone = level.Stone,
                                        wood = level.Wood,
                                        iron = level.Iron,
                                        gold = level.Gold,
                                    },
                                    timeSeconds = level.TimeSeconds,
                                    effectId = level.EffectID,
                                    effectValue = level.EffectValue,
                                    powerGain = level.PowerGain,
                                    prerequisites = EnumerateTechRequirements(level)
                                        .Select(requirement => new
                                        {
                                            techId = requirement.TechID,
                                            level = requirement.Level,
                                        })
                                        .ToArray(),
                                })
                                .ToArray(),
                        };
                    })
                    .ToArray(),
            };

            File.WriteAllText(Path.Combine(techDir, "TechData.json"), JsonSerializer.Serialize(techData, jsonOpt));
                    Console.WriteLine($"Exported TechData.json ({techs.Count} techs, {techLevels.Count} parsed levels, {techKinds.Count} kinds).");
        }

        static object BuildTableProbe(string fileName, string resolvedPath)
        {
            if (!File.Exists(resolvedPath))
            {
                return new
                {
                    FileName = fileName,
                    ResolvedPath = resolvedPath,
                    Exists = false,
                };
            }

            byte[] bytes = File.ReadAllBytes(resolvedPath);
            ushort header0 = bytes.Length >= 2 ? BitConverter.ToUInt16(bytes, 0) : (ushort)0;
            ushort declaredRecordCount = bytes.Length >= 4 ? BitConverter.ToUInt16(bytes, 2) : (ushort)0;
            int payloadLength = Math.Max(0, bytes.Length - 4);
            int inferredRecordSize = 0;
            int payloadRemainder = 0;

            if (declaredRecordCount > 0)
            {
                inferredRecordSize = payloadLength / declaredRecordCount;
                payloadRemainder = payloadLength % declaredRecordCount;
            }

            string firstPayloadHex = ToHex(bytes, 4, Math.Min(payloadLength, 64));
            var sampleRows = new List<string>();

            if (declaredRecordCount > 0 && inferredRecordSize > 0 && payloadRemainder == 0)
            {
                int sampleCount = Math.Min(declaredRecordCount, (ushort)3);
                for (int i = 0; i < sampleCount; i++)
                {
                    int offset = 4 + i * inferredRecordSize;
                    sampleRows.Add(ToHex(bytes, offset, Math.Min(inferredRecordSize, 32)));
                }
            }
            else if (!string.IsNullOrEmpty(firstPayloadHex))
            {
                sampleRows.Add(firstPayloadHex);
            }

            return new
            {
                FileName = fileName,
                ResolvedPath = resolvedPath,
                Exists = true,
                ByteLength = bytes.Length,
                Header0 = header0,
                DeclaredRecordCount = declaredRecordCount,
                PayloadLength = payloadLength,
                InferredExactRecordSize = declaredRecordCount > 0 && payloadRemainder == 0 ? inferredRecordSize : (int?)null,
                PayloadRemainder = declaredRecordCount > 0 ? payloadRemainder : (int?)null,
                Sha256 = Convert.ToHexString(SHA256.HashData(bytes)),
                FirstPayloadHex = firstPayloadHex,
                SampleRows = sampleRows,
            };
        }

        static IEnumerable<TechRequirementTbl> EnumerateTechRequirements(TechLvTbl level)
        {
            if (level.Prerequisites is null)
            {
                yield break;
            }

            foreach (var requirement in level.Prerequisites)
            {
                if (requirement.TechID == 0 || requirement.Level == 0)
                {
                    continue;
                }

                yield return requirement;
            }
        }

        static Dictionary<(ushort TechId, byte Level), (ushort ItemId, ushort Amount, string SourceTable)> BuildSpecialResearchCostLookup(
            string tablesPath,
            IEnumerable<ushort> validItemIds)
        {
            var validItemIdSet = validItemIds.ToHashSet();
            var result = new Dictionary<(ushort TechId, byte Level), (ushort ItemId, ushort Amount, string SourceTable)>();

            void AddFromTable(string fileName)
            {
                string tablePath = ResolveTablePath(tablesPath, fileName);
                foreach (var row in ParseTable<TechLvSp2RawTbl>(tablePath))
                {
                    if (!TryDecodeSpecialResearchItemCost(row.RawData, validItemIdSet, out ushort itemId, out ushort amount))
                    {
                        continue;
                    }

                    result[(row.TechID, row.Level)] = (itemId, amount, fileName);
                }
            }

            AddFromTable("TechLvSp.bytes");
            AddFromTable("TechLvSp2.bytes");

            return result;
        }

        static object[] BuildSpecialResearchCostExport(
            Dictionary<(ushort TechId, byte Level), (ushort ItemId, ushort Amount, string SourceTable)> specialResearchCostByTechLevel,
            Dictionary<ushort, string?> itemNameById,
            ushort techId,
            byte level)
        {
            if (!specialResearchCostByTechLevel.TryGetValue((techId, level), out var specialCost))
            {
                return Array.Empty<object>();
            }

            itemNameById.TryGetValue(specialCost.ItemId, out string? itemName);

            return new object[]
            {
                new
                {
                    itemId = specialCost.ItemId,
                    itemName,
                    amount = specialCost.Amount,
                    sourceTable = specialCost.SourceTable,
                }
            };
        }

        static bool TryDecodeSpecialResearchItemCost(
            byte[]? rawData,
            HashSet<ushort> validItemIds,
            out ushort itemId,
            out ushort amount)
        {
            itemId = 0;
            amount = 0;

            if (rawData is null || rawData.Length < 8)
            {
                return false;
            }

            // TechLvSP / TechLvSP2 bytes 9..12 resolve consistently to ushort itemId + ushort count.
            itemId = BitConverter.ToUInt16(rawData, 4);
            amount = BitConverter.ToUInt16(rawData, 6);

            return itemId != 0
                && amount != 0
                && validItemIds.Contains(itemId);
        }

        static string? LookupString(Dictionary<ushort, string> strings, ushort key)
        {
            if (key == 0)
            {
                return null;
            }

            return strings.TryGetValue(key, out var value) ? value : null;
        }

        static string ToHex(byte[] bytes, int offset, int count)
        {
            if (offset < 0 || count <= 0 || offset >= bytes.Length)
            {
                return string.Empty;
            }

            int safeCount = Math.Min(count, bytes.Length - offset);
            return Convert.ToHexString(bytes, offset, safeCount);
        }

        static Dictionary<ushort, string> ParseStringTable(string path1, string path2)
        {
            var result = new Dictionary<ushort, string>();
            if (!File.Exists(path1) || !File.Exists(path2)) return result;

            byte[] textAsset = File.ReadAllBytes(path1);
            byte[] textAsset2 = File.ReadAllBytes(path2);

            int recordAmount = BitConverter.ToInt32(textAsset2, 0);
            int maxKey = BitConverter.ToInt32(textAsset, 0);

            // st2 layout: [int32 byteCount] then [ushort recordIndex] per string key
            // st1 layout: [int32 maxKey] then [int32 offset, ushort length, ushort pad] * N, then UTF-8 string data
            // Lookup: for string key 'i', st2[4 + i*2] = recordIndex -> st1[4 + (recordIndex-1)*8] = (offset, length)
            int num3 = recordAmount / 2;
            for (int i = 1; i < num3; i++)
            {
                int p2Offset = 4 + i * 2;
                if (p2Offset + 2 > textAsset2.Length) break;
                ushort recordIndex = BitConverter.ToUInt16(textAsset2, p2Offset);

                if (recordIndex > 0)
                {
                    int num4 = 4 + (recordIndex - 1) * 8;
                    if (num4 + 6 > textAsset.Length) continue;

                    int num6 = BitConverter.ToInt32(textAsset, num4);
                    ushort num7 = BitConverter.ToUInt16(textAsset, num4 + 4);
                    int strStart = 4 + maxKey + num6;

                    if (strStart + num7 <= textAsset.Length) {
                        string s = Encoding.UTF8.GetString(textAsset, strStart, num7);
                        result[(ushort)i] = s;  // key is the string ID 'i', not the record index
                    }
                }
            }
            return result;
        }

        static List<T> ParseTable<T>(string path) where T : struct
        {
            var list = new List<T>();
            if (!File.Exists(path)) {
                Console.WriteLine($"File not found: {path}");
                return list;
            }

            byte[] bytes = File.ReadAllBytes(path);
            if (bytes.Length <= 4) return list;

            int structSize = Marshal.SizeOf(typeof(T));
            int recordAmount = BitConverter.ToUInt16(bytes, 2); // 2nd ushort is count?

            int expectedSize = 4 + recordAmount * structSize;
            int num = bytes.Length - 4;
            int maxRecords = num / structSize;
            
            int numRecords = Math.Min((int)BitConverter.ToUInt16(bytes, 2), maxRecords);

            IntPtr ptr = Marshal.AllocHGlobal(structSize);
            try
            {
                for (int i = 0; i < numRecords; i++)
                {
                    int offset = 4 + i * structSize;
                    Marshal.Copy(bytes, offset, ptr, structSize);
                    T item = Marshal.PtrToStructure<T>(ptr);
                    list.Add(item);
                }
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }

            return list;
        }
    }
}
