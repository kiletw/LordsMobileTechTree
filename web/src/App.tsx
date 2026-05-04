import { useEffect, useState } from 'react'
import { LanguageSwitcher, useI18n } from './i18n/I18nContext'
import './App.css'

type TechKind = {
  id: number
  nameKey: number
  name: string | null
  sortOrder: number
}

type TechRequirement = {
  techId: number
  level: number
}

type TechSpecialCost = {
  itemId: number
  itemName: string | null
  amount: number
  sourceTable: string
}

type TechLevel = {
  specialCosts?: TechSpecialCost[]
  rowId: number
  level: number
  academyLevel: number
  cost: {
    food: number
    stone: number
    wood: number
    iron: number
    gold: number
  }
  timeSeconds: number
  effectId: number
  effectValue: number
  powerGain: number
  prerequisites: TechRequirement[]
}

type TechEntry = {
  id: number
  kindId: number
  kindNameKey: number
  nameKey: number
  name: string | null
  treeNodeId: number
  maxLevel: number
  plannerSupported: boolean
  supplementalLevelCount: number
  dataStatus: 'full' | 'supplemental-only' | 'missing'
  levels: TechLevel[]
}

type TechDataset = {
  version: string
  catalog?: {
    kindTable: string
    techTable: string
    treeTable: string
  }
  kinds: TechKind[]
  treeNodes: Array<{ id: number; rawBytesHex: string }>
  techs: TechEntry[]
}

type EffectEntry = {
  ID: number
  NameID: number
  Name: string | null
  DescriptionID: number
  Description: string | null
  Icon: number
  Type: number
  Target: number
  Value: number
}

type DecodedTreeLink = {
  targetNodeId: number
  styleCode: number
  variantCode: number
}

type DecodedTreeNode = {
  id: number
  rawBytesHex: string
  column: number
  groupCode: number
  variantCode: number
  links: DecodedTreeLink[]
}

type TechTreeCard = {
  tech: TechEntry
  column: number
  row: number
  sameKindParents: TechEntry[]
  treeNode: DecodedTreeNode | null
}

type TechTreeRow = {
  row: number
  depth: number
  cards: TechTreeCard[]
}

type TechTreeEdge = {
  key: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

const RESEARCH_SPEED_STORAGE_KEY = 'lmt-research-speed'
const CURRENT_LEVELS_STORAGE_KEY = 'lmt-current-levels'
const TARGET_LEVELS_STORAGE_KEY = 'lmt-target-levels'
const SELECTED_KIND_STORAGE_KEY = 'lmt-selected-kind'

function formatCount(locale: string, value?: number | null) {
  if (value === undefined || value === null) {
    return '--'
  }

  return new Intl.NumberFormat(locale).format(value)
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return '0s'
  }

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days}d`)
  }
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`)
  }

  return parts.join(' ')
}

function parseSavedLevelMap(storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      return {} as Record<number, number>
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const result: Record<number, number> = {}

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'number') {
        continue
      }

      result[Number(key)] = value
    }

    return result
  } catch {
    return {} as Record<number, number>
  }
}

function resolveGameText(gameString: (id: number) => string, key: number, fallback: string | null) {
  const translated = gameString(key)
  return translated.startsWith('[#') ? (fallback ?? translated) : translated
}

function resolveSpecialCostName(itemName: string | null, itemId: number, t: (key: string, params?: Record<string, string | number>) => string) {
  return itemName && itemName.trim().length > 0
    ? itemName
    : t('planner.specialCostFallback', { id: itemId })
}

function formatEffectMetricLabel(effectName: string, formattedValue: string) {
  return /[+\-]$/.test(effectName) ? `${effectName}${formattedValue}` : `${effectName}: ${formattedValue}`
}

function getEffectDelta(levels: TechLevel[], level: TechLevel) {
  const previousLevel = levels.find((candidate) => candidate.level === level.level - 1)
  return level.effectValue - (previousLevel?.effectValue ?? 0)
}

function isPercentLikeEffect(effect: EffectEntry | undefined) {
  if (!effect) {
    return false
  }

  return (effect.Type === 26 && effect.Target === 17) || (effect.Type === 67 && effect.Target === 39)
}

function formatScaledPercent(locale: string, rawValue: number) {
  const scaledValue = rawValue / 100000
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: scaledValue >= 10 ? 0 : 1,
    maximumFractionDigits: scaledValue >= 10 ? 2 : 2,
  })

  return `${formatter.format(scaledValue)}%`
}

function formatEffectDisplayValue(locale: string, rawValue: number, effect: EffectEntry | undefined) {
  if (isPercentLikeEffect(effect)) {
    return formatScaledPercent(locale, rawValue)
  }

  return formatCount(locale, rawValue)
}

function resolveEffectMeta(
  effectId: number,
  effectById: Map<number, EffectEntry>,
  gameString: (id: number) => string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const effect = effectById.get(effectId)
  if (!effect) {
    return {
      name: t('planner.effectFallback', { id: effectId }),
      description: null as string | null,
      effect: undefined as EffectEntry | undefined,
    }
  }

  const name = resolveGameText(gameString, effect.NameID, effect.Name)
  const description = resolveGameText(gameString, effect.DescriptionID, effect.Description)

  return {
    name: name.trim().length > 0 ? name : t('planner.effectFallback', { id: effectId }),
    description: description.trim().length > 0 ? description : null,
    effect,
  }
}

function getGamePagePowerDelta(levels: TechLevel[], level: TechLevel) {
  const previousLevel = levels.find((candidate) => candidate.level === level.level - 1)
  return level.effectValue - (previousLevel?.effectValue ?? 0)
}

function decodeTreeNode(rawBytesHex: string, id: number): DecodedTreeNode {
  const bytes: number[] = []
  for (let index = 0; index < rawBytesHex.length; index += 2) {
    bytes.push(Number.parseInt(rawBytesHex.slice(index, index + 2), 16))
  }

  const links: DecodedTreeLink[] = []
  for (let offset = 3; offset + 3 < bytes.length; offset += 4) {
    const targetNodeId = bytes[offset] + (bytes[offset + 1] << 8)
    if (targetNodeId === 0) {
      continue
    }

    links.push({
      targetNodeId,
      styleCode: bytes[offset + 2],
      variantCode: bytes[offset + 3],
    })
  }

  return {
    id,
    rawBytesHex,
    column: bytes[0] ?? 0,
    groupCode: bytes[1] ?? 0,
    variantCode: bytes[2] ?? 0,
    links,
  }
}

function isPlannerSupported(tech: TechEntry) {
  return tech.plannerSupported && tech.levels.length > 0
}

function getUnlockLevel(tech: TechEntry) {
  return tech.levels.reduce<TechLevel | null>((lowestLevel, candidate) => {
    if (!lowestLevel || candidate.level < lowestLevel.level) {
      return candidate
    }

    return lowestLevel
  }, null)
}

function App() {
  const { gameString, gameStrings, locale, t } = useI18n()
  const [dataset, setDataset] = useState<TechDataset | null>(null)
  const [effects, setEffects] = useState<EffectEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [currentLevels, setCurrentLevels] = useState(() => parseSavedLevelMap(CURRENT_LEVELS_STORAGE_KEY))
  const [targetLevels, setTargetLevels] = useState(() => parseSavedLevelMap(TARGET_LEVELS_STORAGE_KEY))
  const [selectedKindId, setSelectedKindId] = useState<number | null>(() => {
    const raw = localStorage.getItem(SELECTED_KIND_STORAGE_KEY)
    return raw ? Number(raw) : null
  })
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null)
  const [researchSpeedBonus, setResearchSpeedBonus] = useState(() => {
    return localStorage.getItem(RESEARCH_SPEED_STORAGE_KEY) ?? '0'
  })

  useEffect(() => {
    localStorage.setItem(RESEARCH_SPEED_STORAGE_KEY, researchSpeedBonus)
  }, [researchSpeedBonus])

  useEffect(() => {
    localStorage.setItem(CURRENT_LEVELS_STORAGE_KEY, JSON.stringify(currentLevels))
  }, [currentLevels])

  useEffect(() => {
    localStorage.setItem(TARGET_LEVELS_STORAGE_KEY, JSON.stringify(targetLevels))
  }, [targetLevels])

  useEffect(() => {
    if (selectedKindId !== null) {
      localStorage.setItem(SELECTED_KIND_STORAGE_KEY, String(selectedKindId))
    }
  }, [selectedKindId])

  useEffect(() => {
    let cancelled = false

    const loadTechDataset = async () => {
      setIsLoading(true)
      setHasLoadError(false)

      try {
        const res = await fetch(`${import.meta.env.BASE_URL}tech/TechData.json`)
        if (!res.ok) {
          throw new Error('Failed to load tech dataset')
        }

        const data = (await res.json()) as TechDataset
        let effectData: EffectEntry[] = []

        try {
          const effectRes = await fetch(`${import.meta.env.BASE_URL}Effect.json`)
          if (effectRes.ok) {
            effectData = (await effectRes.json()) as EffectEntry[]
          }
        } catch {
          effectData = []
        }

        if (!cancelled) {
          setDataset(data)
          setEffects(effectData)
        }
      } catch {
        if (!cancelled) {
          setHasLoadError(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadTechDataset()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!dataset || dataset.kinds.length === 0) {
      return
    }

    const firstKindId = dataset.kinds[0].id
    const activeKindId = selectedKindId ?? firstKindId
    const kindExists = dataset.kinds.some((kind) => kind.id === activeKindId)

    if (!kindExists) {
      setSelectedKindId(firstKindId)
      return
    }

    if (selectedKindId === null) {
      setSelectedKindId(activeKindId)
    }
  }, [dataset, selectedKindId])

  const kinds = dataset?.kinds ?? []
  const techs = dataset?.techs ?? []
  const treeNodes = dataset?.treeNodes ?? []
  const effectById = new Map(effects.map((effect) => [effect.ID, effect]))
  const decodedTreeNodeById = new Map(treeNodes.map((node) => [node.id, decodeTreeNode(node.rawBytesHex, node.id)]))

  const activeKindId = selectedKindId ?? kinds[0]?.id ?? null
  const visibleTechs = techs
    .filter((tech) => tech.kindId === activeKindId)
    .sort((left, right) => left.treeNodeId - right.treeNodeId || left.id - right.id)
  const visibleTechById = new Map(visibleTechs.map((tech) => [tech.id, tech]))
  const unlockDependencyIdsByTechId = new Map<number, number[]>()

  for (const tech of visibleTechs) {
    const unlockLevel = getUnlockLevel(tech)
    const dependencyIds = Array.from(
      new Set(
        (unlockLevel?.prerequisites ?? [])
          .map((requirement) => requirement.techId)
          .filter((techId) => techId !== tech.id && visibleTechById.has(techId)),
      ),
    )

    unlockDependencyIdsByTechId.set(tech.id, dependencyIds)
  }

  const treeNodeCellWidth = 252
  const treeNodeCellHeight = 228
  const treeNodeYInset = 28
  const techCardBaseHeight = 180
  const techCardMinWidth = 220
  const maxCardsPerTreeRow = 4
  const techDepthById = new Map<number, number>()
  const visitingTechIds = new Set<number>()

  const getTechDepth = (techId: number): number => {
    const cachedDepth = techDepthById.get(techId)
    if (cachedDepth !== undefined) {
      return cachedDepth
    }

    if (visitingTechIds.has(techId)) {
      return 0
    }

    visitingTechIds.add(techId)
    const parentIds = (unlockDependencyIdsByTechId.get(techId) ?? [])
      .filter((dependencyId) => visibleTechById.has(dependencyId))

    const depth = parentIds.length === 0
      ? 0
      : Math.max(...parentIds.map((parentId) => getTechDepth(parentId))) + 1

    visitingTechIds.delete(techId)
    techDepthById.set(techId, depth)

    return depth
  }

  const cardsByDepth = new Map<number, TechTreeCard[]>()

  for (const tech of visibleTechs) {
    const treeNode = decodedTreeNodeById.get(tech.treeNodeId) ?? null
    const sameKindParents = (unlockDependencyIdsByTechId.get(tech.id) ?? [])
      .map((dependencyId) => visibleTechById.get(dependencyId))
      .filter((dependency): dependency is TechEntry => dependency !== undefined)
    const depth = getTechDepth(tech.id)

    if (!cardsByDepth.has(depth)) {
      cardsByDepth.set(depth, [])
    }

    cardsByDepth.get(depth)?.push({
      tech,
      column: 0,
      row: 0,
      sameKindParents,
      treeNode,
    })
  }

  const sortedDepths = Array.from(cardsByDepth.keys()).sort((left, right) => left - right)
  const techTreeRows: TechTreeRow[] = []
  const horizontalSortValueByTechId = new Map<number, number>()

  const getTreeMetaSortValue = (card: TechTreeCard) => {
    const column = card.treeNode?.column ?? 0
    const group = card.treeNode?.groupCode ?? 0
    const variant = card.treeNode?.variantCode ?? 0

    return (column * 1_000_000) + (group * 10_000) + (variant * 100) + card.tech.treeNodeId
  }

  const getParentAnchorSortValue = (card: TechTreeCard) => {
    const parentSortValues = (unlockDependencyIdsByTechId.get(card.tech.id) ?? [])
      .map((dependencyId) => horizontalSortValueByTechId.get(dependencyId))
      .filter((sortValue): sortValue is number => sortValue !== undefined)

    if (parentSortValues.length === 0) {
      return null
    }

    return parentSortValues.reduce((total, sortValue) => total + sortValue, 0) / parentSortValues.length
  }

  for (const depth of sortedDepths) {
    const cards = (cardsByDepth.get(depth) ?? [])
      .sort((left, right) => {
        const leftParentAnchor = getParentAnchorSortValue(left)
        const rightParentAnchor = getParentAnchorSortValue(right)

        if (leftParentAnchor !== null && rightParentAnchor !== null && leftParentAnchor !== rightParentAnchor) {
          return leftParentAnchor - rightParentAnchor
        }

        if (leftParentAnchor !== null && rightParentAnchor === null) {
          return -1
        }

        if (leftParentAnchor === null && rightParentAnchor !== null) {
          return 1
        }

        return getTreeMetaSortValue(left) - getTreeMetaSortValue(right)
          || left.tech.treeNodeId - right.tech.treeNodeId
          || left.tech.id - right.tech.id
      })

    cards.forEach((card, index) => {
      horizontalSortValueByTechId.set(card.tech.id, index)
    })

    for (let start = 0; start < cards.length; start += maxCardsPerTreeRow) {
      const rowIndex = techTreeRows.length
      const rowCards = cards
        .slice(start, start + maxCardsPerTreeRow)
        .map((card, column) => ({
          ...card,
          column,
          row: rowIndex,
        }))

      techTreeRows.push({
        row: rowIndex,
        depth,
        cards: rowCards,
      })
    }
  }

  const treeColumnCount = maxCardsPerTreeRow
  const maxTreeRowCount = Math.max(techTreeRows.length, 1)
  const treeBoardWidth = treeColumnCount * treeNodeCellWidth
  const treeBoardHeight = maxTreeRowCount * treeNodeCellHeight
  const cardPositionByTechId = new Map<number, { x: number; y: number }>()

  for (const row of techTreeRows) {
    const rowWidth = row.cards.length * treeNodeCellWidth
    const rowOffsetX = (treeBoardWidth - rowWidth) / 2

    for (const card of row.cards) {
      cardPositionByTechId.set(card.tech.id, {
        x: rowOffsetX + (card.column * treeNodeCellWidth) + (treeNodeCellWidth / 2),
        y: (card.row * treeNodeCellHeight) + treeNodeYInset,
      })
    }
  }

  const techTreeEdges: TechTreeEdge[] = []
  const seenEdgeKeys = new Set<string>()
  for (const tech of visibleTechs) {
    const targetPosition = cardPositionByTechId.get(tech.id)
    if (!targetPosition) {
      continue
    }

    for (const dependencyId of unlockDependencyIdsByTechId.get(tech.id) ?? []) {
      const sourcePosition = cardPositionByTechId.get(dependencyId)
      if (!sourcePosition) {
        continue
      }

      const edgeKey = `${dependencyId}:${tech.id}`
      if (seenEdgeKeys.has(edgeKey)) {
        continue
      }

      seenEdgeKeys.add(edgeKey)
      techTreeEdges.push({
        key: edgeKey,
        fromX: sourcePosition.x,
        fromY: sourcePosition.y + techCardBaseHeight,
        toX: targetPosition.x,
        toY: targetPosition.y,
      })
    }
  }

  useEffect(() => {
    if (visibleTechs.length === 0) {
      setSelectedTechId(null)
      return
    }

    if (!visibleTechs.some((tech) => tech.id === selectedTechId)) {
      setSelectedTechId(visibleTechs[0].id)
    }
  }, [selectedTechId, visibleTechs])

  function getCurrentLevel(tech: TechEntry) {
    if (!isPlannerSupported(tech)) {
      return 0
    }

    const value = currentLevels[tech.id] ?? 0
    return Math.min(Math.max(value, 0), tech.maxLevel)
  }

  function getTargetLevel(tech: TechEntry, currentLevel: number) {
    if (!isPlannerSupported(tech)) {
      return 0
    }

    const rawTarget = targetLevels[tech.id]
    if (rawTarget === undefined) {
      return currentLevel
    }

    return Math.min(Math.max(rawTarget, currentLevel), tech.maxLevel)
  }

  function updateCurrentLevel(tech: TechEntry, nextValue: number) {
    if (!isPlannerSupported(tech)) {
      return
    }

    const nextCurrent = Math.min(Math.max(nextValue, 0), tech.maxLevel)
    const nextTarget = Math.max(getTargetLevel(tech, getCurrentLevel(tech)), nextCurrent)

    setCurrentLevels((prev) => ({ ...prev, [tech.id]: nextCurrent }))
    setTargetLevels((prev) => ({ ...prev, [tech.id]: nextTarget }))
  }

  function updateTargetLevel(tech: TechEntry, nextValue: number) {
    if (!isPlannerSupported(tech)) {
      return
    }

    const currentLevel = getCurrentLevel(tech)
    const nextTarget = Math.min(Math.max(nextValue, currentLevel), tech.maxLevel)
    setTargetLevels((prev) => ({ ...prev, [tech.id]: nextTarget }))
  }

  function syncTargetsToCurrent() {
    const synced: Record<number, number> = {}

    for (const tech of techs) {
      synced[tech.id] = getCurrentLevel(tech)
    }

    setTargetLevels(synced)
  }

  function resetPlanner() {
    setCurrentLevels({})
    setTargetLevels({})
  }

  const numericResearchSpeed = Number(researchSpeedBonus) || 0
  const researchTimeFactor = 1 / (1 + Math.max(numericResearchSpeed, 0) / 100)
  const selectedTech = techs.find((tech) => tech.id === selectedTechId) ?? visibleTechs[0] ?? null

  let plannedTechCount = 0
  let plannedLevelCount = 0
  let totalFood = 0
  let totalStone = 0
  let totalWood = 0
  let totalIron = 0
  let totalGold = 0
  let totalTimeSeconds = 0
  let totalGamePagePower = 0
  let maxAcademyLevel = 0
  const effectDeltas = new Map<number, number>()
  const missingRequirements = new Map<string, string>()
  const specialCostTotals = new Map<number, { itemId: number; itemName: string | null; amount: number }>()

  for (const tech of techs) {
    if (!isPlannerSupported(tech)) {
      continue
    }

    const currentLevel = getCurrentLevel(tech)
    const targetLevel = getTargetLevel(tech, currentLevel)

    if (targetLevel > currentLevel) {
      plannedTechCount += 1
    }

    const currentEffectValue = tech.levels.find((level) => level.level === currentLevel)?.effectValue ?? 0
    const targetEffect = tech.levels.find((level) => level.level === targetLevel)
    if (targetEffect && targetEffect.effectId > 0) {
      const delta = targetEffect.effectValue - currentEffectValue
      if (delta !== 0) {
        effectDeltas.set(targetEffect.effectId, (effectDeltas.get(targetEffect.effectId) ?? 0) + delta)
      }
    }

    for (const level of tech.levels) {
      if (level.level <= currentLevel || level.level > targetLevel) {
        continue
      }

      plannedLevelCount += 1
      totalFood += level.cost.food
      totalStone += level.cost.stone
      totalWood += level.cost.wood
      totalIron += level.cost.iron
      totalGold += level.cost.gold
      totalTimeSeconds += level.timeSeconds
      totalGamePagePower += getGamePagePowerDelta(tech.levels, level)
      maxAcademyLevel = Math.max(maxAcademyLevel, level.academyLevel)

      for (const specialCost of level.specialCosts ?? []) {
        const existingTotal = specialCostTotals.get(specialCost.itemId)
        specialCostTotals.set(specialCost.itemId, {
          itemId: specialCost.itemId,
          itemName: specialCost.itemName,
          amount: (existingTotal?.amount ?? 0) + specialCost.amount,
        })
      }

      for (const requirement of level.prerequisites) {
        const requiredTech = techs.find((item) => item.id === requirement.techId)
        if (!requiredTech) {
          continue
        }

        const requiredCurrent = getCurrentLevel(requiredTech)
        const requiredTarget = getTargetLevel(requiredTech, requiredCurrent)
        if (requiredTarget >= requirement.level) {
          continue
        }

        const name = resolveGameText(gameString, requiredTech.nameKey, requiredTech.name)
        missingRequirements.set(
          `${requirement.techId}:${requirement.level}`,
          `${name} Lv.${requirement.level}`,
        )
      }
    }
  }

  const adjustedTimeSeconds = Math.ceil(totalTimeSeconds * researchTimeFactor)
  const effectSummary = Array.from(effectDeltas.entries())
    .sort((left, right) => left[0] - right[0])
    .slice(0, 8)
  const specialCostSummary = Array.from(specialCostTotals.values())
    .sort((left, right) => left.itemId - right.itemId)

  return (
    <div className="planner-shell">
      <header className="panel planner-header">
        <div className="planner-title-block">
          <h1>{t('app.title')}</h1>
          <p className="subtitle">{t('app.subtitle')}</p>
        </div>

        <div className="planner-controls">
          <LanguageSwitcher />

          <label className="research-speed-field">
            <span>{t('planner.researchSpeed')}</span>
            <input
              type="number"
              inputMode="decimal"
              value={researchSpeedBonus}
              onChange={(event) => setResearchSpeedBonus(event.target.value)}
            />
            <small>{t('planner.researchSpeedHelp')}</small>
          </label>
        </div>
      </header>

      <main className="planner-grid">
        <section className="panel overview-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{t('planner.statusLabel')}</p>
              <h2>{t('planner.overviewTitle')}</h2>
            </div>
            <span className="status-pill status-pill--ready">{t('planner.ready')}</span>
          </div>

          <div className="metric-grid">
            <article className="metric-card">
              <span>{t('planner.metric.locale')}</span>
              <strong>{locale}</strong>
              <small>{t('planner.localeLabel')}</small>
            </article>

            <article className="metric-card">
              <span>{t('planner.metric.strings')}</span>
              <strong>{formatCount(locale, Object.keys(gameStrings).length)}</strong>
              <small>{t('planner.rows', { count: Object.keys(gameStrings).length })}</small>
            </article>

            <article className="metric-card">
              <span>{t('planner.metric.kinds')}</span>
              <strong>{formatCount(locale, kinds.length)}</strong>
              <small>{t('planner.metric.kindsHelp')}</small>
            </article>

            <article className="metric-card">
              <span>{t('planner.metric.tech')}</span>
              <strong>{formatCount(locale, techs.length)}</strong>
              <small>{t('planner.metric.techHelp')}</small>
            </article>

            <article className="metric-card">
              <span>{t('planner.metric.techLv')}</span>
              <strong>{formatCount(locale, techs.reduce((sum, tech) => sum + tech.levels.length, 0))}</strong>
              <small>{t('planner.metric.techLvHelp')}</small>
            </article>

            <article className="metric-card">
              <span>{t('planner.metric.multiplier')}</span>
              <strong>x{researchTimeFactor.toFixed(3)}</strong>
              <small>{t('planner.speedFactorHelp')}</small>
            </article>
          </div>

          <p className="overview-note">{t('planner.overviewNote')}</p>
        </section>

        <section className="panel planner-browser-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{t('planner.browserKicker')}</p>
              <h2>{t('planner.browserTitle')}</h2>
            </div>

            <span className={`status-pill ${isLoading ? 'status-pill--loading' : 'status-pill--ready'}`}>
              {isLoading ? t('planner.loading') : t('planner.ready')}
            </span>
          </div>

          {hasLoadError ? <p className="empty-state">{t('planner.error')}</p> : null}

          {!hasLoadError && !isLoading && techs.length === 0 ? (
            <p className="empty-state">{t('planner.datasetMissing')}</p>
          ) : null}

          <div className="planner-browser-grid">
            <div className="kind-column">
              <p className="probe-label">{t('planner.kindColumn')}</p>
              <div className="kind-list">
                {kinds.map((kind) => (
                  <button
                    key={kind.id}
                    type="button"
                    className={`kind-pill ${kind.id === activeKindId ? 'kind-pill--active' : ''}`}
                    onClick={() => setSelectedKindId(kind.id)}
                  >
                    <span>{resolveGameText(gameString, kind.nameKey, kind.name)}</span>
                    <small>{techs.filter((tech) => tech.kindId === kind.id).length}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="tech-column">
              <div className="tech-column__header">
                <p className="probe-label">{t('planner.techColumn')}</p>
                <div className="planner-actions">
                  <button type="button" className="secondary-button" onClick={syncTargetsToCurrent}>
                    {t('planner.syncTargets')}
                  </button>
                  <button type="button" className="secondary-button" onClick={resetPlanner}>
                    {t('planner.resetPlanner')}
                  </button>
                </div>
              </div>

              {visibleTechs.length === 0 ? (
                <p className="empty-state">{t('planner.kindEmpty')}</p>
              ) : (
                <>
                  <div className="tech-tree-scroll">
                    <div
                      className="tech-tree-board"
                      style={{
                        minWidth: `${treeBoardWidth}px`,
                      }}
                    >
                      <svg
                        className="tech-tree-board__edges"
                        viewBox={`0 0 ${treeBoardWidth} ${treeBoardHeight}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        {techTreeEdges.map((edge) => {
                          const controlY = edge.fromY + ((edge.toY - edge.fromY) * 0.5)

                          return (
                            <path
                              key={edge.key}
                              d={`M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${controlY}, ${edge.toX} ${controlY}, ${edge.toX} ${edge.toY}`}
                              className="tech-tree-edge"
                            />
                          )
                        })}
                      </svg>

                      {techTreeRows.map((row) => (
                        <section
                          key={`row-${row.row}-depth-${row.depth}`}
                          className="tech-tree-row"
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(row.cards.length, 1)}, minmax(${techCardMinWidth}px, 1fr))`,
                            width: `${Math.max(row.cards.length, 1) * treeNodeCellWidth}px`,
                          }}
                        >
                            {row.cards.map(({ tech, sameKindParents }) => {
                              const currentLevel = getCurrentLevel(tech)
                              const targetLevel = getTargetLevel(tech, currentLevel)
                              const label = resolveGameText(gameString, tech.nameKey, tech.name)
                              const plannerSupported = isPlannerSupported(tech)

                              return (
                                <article
                                  key={tech.id}
                                  className={`tech-card tech-card--tree ${tech.id === selectedTech?.id ? 'tech-card--active' : ''} ${plannerSupported ? '' : 'tech-card--unsupported'}`}
                                  onClick={() => setSelectedTechId(tech.id)}
                                >
                                  <div className="tech-card__title">
                                    <div>
                                      <h3>{label}</h3>
                                    </div>
                                    <span className={`status-pill ${plannerSupported ? 'status-pill--muted' : 'status-pill--warning'}`}>
                                      {plannerSupported ? `Lv.${tech.maxLevel}` : t('planner.catalogOnlyBadge')}
                                    </span>
                                  </div>

                                  {sameKindParents.length > 0 ? (
                                    <ul className="tech-card__dependency-list">
                                      {sameKindParents.slice(0, 2).map((parent) => (
                                        <li key={parent.id}>{resolveGameText(gameString, parent.nameKey, parent.name)}</li>
                                      ))}
                                      {sameKindParents.length > 2 ? <li key={`${tech.id}-more`}>+{sameKindParents.length - 2}</li> : null}
                                    </ul>
                                  ) : (
                                    <div className="tech-card__root-mark" />
                                  )}

                                  {plannerSupported ? (
                                    <div className="level-input-grid">
                                      <label>
                                        <span>{t('planner.currentLevel')}</span>
                                        <select
                                          value={currentLevel}
                                          onChange={(event) => updateCurrentLevel(tech, Number(event.target.value))}
                                          onClick={(event) => event.stopPropagation()}
                                        >
                                          {Array.from({ length: tech.maxLevel + 1 }, (_, level) => (
                                            <option key={level} value={level}>
                                              {level}
                                            </option>
                                          ))}
                                        </select>
                                      </label>

                                      <label>
                                        <span>{t('planner.targetLevel')}</span>
                                        <select
                                          value={targetLevel}
                                          onChange={(event) => updateTargetLevel(tech, Number(event.target.value))}
                                          onClick={(event) => event.stopPropagation()}
                                        >
                                          {Array.from({ length: tech.maxLevel + 1 }, (_, level) => (
                                            <option key={level} value={level}>
                                              {level}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                    </div>
                                  ) : (
                                    <p className="tech-card__support-note">{t('planner.catalogOnlyHint')}</p>
                                  )}
                                </article>
                              )
                            })}
                        </section>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{t('planner.summaryKicker')}</p>
              <h2>{t('planner.summaryTitle')}</h2>
            </div>
          </div>

          <div className="summary-metrics">
            <div className="summary-card">
              <span>{t('planner.plannedTechs')}</span>
              <strong>{formatCount(locale, plannedTechCount)}</strong>
            </div>
            <div className="summary-card">
              <span>{t('planner.plannedLevels')}</span>
              <strong>{formatCount(locale, plannedLevelCount)}</strong>
            </div>
            <div className="summary-card">
              <span>{t('planner.totalGamePagePower')}</span>
              <strong>{formatCount(locale, totalGamePagePower)}</strong>
            </div>
            <div className="summary-card">
              <span>{t('planner.maxAcademy')}</span>
              <strong>Lv.{maxAcademyLevel}</strong>
            </div>
          </div>

          <dl className="resource-list">
            <div><dt>{t('planner.resource.food')}</dt><dd>{formatCount(locale, totalFood)}</dd></div>
            <div><dt>{t('planner.resource.stone')}</dt><dd>{formatCount(locale, totalStone)}</dd></div>
            <div><dt>{t('planner.resource.wood')}</dt><dd>{formatCount(locale, totalWood)}</dd></div>
            <div><dt>{t('planner.resource.iron')}</dt><dd>{formatCount(locale, totalIron)}</dd></div>
            <div><dt>{t('planner.resource.gold')}</dt><dd>{formatCount(locale, totalGold)}</dd></div>
            <div><dt>{t('planner.totalTime')}</dt><dd>{formatDuration(totalTimeSeconds)}</dd></div>
            <div><dt>{t('planner.totalTimeAdjusted')}</dt><dd>{formatDuration(adjustedTimeSeconds)}</dd></div>
          </dl>

          <div className="detail-block">
            <p className="probe-label">{t('planner.specialCosts')}</p>
            {specialCostSummary.length === 0 ? (
              <div className="special-cost-list">
                <article className="special-cost-card special-cost-card--empty">
                  <span>{t('planner.specialCosts')}</span>
                  <strong>0</strong>
                  <small>{t('planner.noSpecialCosts')}</small>
                </article>
              </div>
            ) : (
              <div className="special-cost-list">
                {specialCostSummary.map((specialCost) => (
                  <article className="special-cost-card" key={specialCost.itemId}>
                    <span>{resolveSpecialCostName(specialCost.itemName, specialCost.itemId, t)}</span>
                    <strong>{formatCount(locale, specialCost.amount)}</strong>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="detail-block">
            <p className="probe-label">{t('planner.missingRequirements')}</p>
            {missingRequirements.size === 0 ? (
              <p className="empty-state">{t('planner.noMissingRequirements')}</p>
            ) : (
              <ul className="tag-list">
                {Array.from(missingRequirements.values()).slice(0, 10).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="detail-block">
            <p className="probe-label">{t('planner.effectSummary')}</p>
            {effectSummary.length === 0 ? (
              <p className="empty-state">{t('planner.noEffectChanges')}</p>
            ) : (
              <ul className="tag-list">
                {effectSummary.map(([effectId, value]) => (
                  <li key={effectId}>
                    {(() => {
                      const effectMeta = resolveEffectMeta(effectId, effectById, gameString, t)
                      return formatEffectMetricLabel(
                        effectMeta.name,
                        formatEffectDisplayValue(locale, value, effectMeta.effect),
                      )
                    })()}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="detail-block">
            <p className="probe-label">{t('planner.selectedTech')}</p>
            {!selectedTech ? (
              <p className="empty-state">{t('planner.noSelectedTech')}</p>
            ) : !isPlannerSupported(selectedTech) ? (
              <div className="selected-tech-panel">
                <h3>{resolveGameText(gameString, selectedTech.nameKey, selectedTech.name)}</h3>
                <p className="empty-state">
                  {selectedTech.supplementalLevelCount > 0
                    ? t('planner.catalogOnlyDetail', { count: selectedTech.supplementalLevelCount })
                    : t('planner.missingTechDetail')}
                </p>
              </div>
            ) : (
              <div className="selected-tech-panel">
                <h3>{resolveGameText(gameString, selectedTech.nameKey, selectedTech.name)}</h3>

                <div className="level-detail-list">
                  {selectedTech.levels.map((level) => {
                    const isReached = level.level <= getCurrentLevel(selectedTech)
                    const isPlanned = level.level > getCurrentLevel(selectedTech) && level.level <= getTargetLevel(selectedTech, getCurrentLevel(selectedTech))
                    const effectMeta = resolveEffectMeta(level.effectId, effectById, gameString, t)
                    const effectDelta = getEffectDelta(selectedTech.levels, level)

                    return (
                      <article
                        key={level.rowId}
                        className={`level-detail-card ${isReached ? 'level-detail-card--current' : ''} ${isPlanned ? 'level-detail-card--planned' : ''}`}
                      >
                        <div className="level-detail-card__header">
                          <strong>{t('planner.levelTitle', { level: level.level })}</strong>
                        </div>

                        <p>{t('planner.gamePagePowerLabel', { value: formatCount(locale, getGamePagePowerDelta(selectedTech.levels, level)) })}</p>
                        <p>{t('planner.academyLabel', { value: level.academyLevel })}</p>
                        <p>{effectMeta.name}</p>
                        <p>{t('planner.effectValueLabel', { value: formatEffectDisplayValue(locale, level.effectValue, effectMeta.effect) })}</p>
                        <p>{t('planner.effectDeltaLabel', { value: formatEffectDisplayValue(locale, effectDelta, effectMeta.effect) })}</p>
                        {effectMeta.description ? <p>{effectMeta.description}</p> : null}
                        <p>{t('planner.timeLabel', { value: formatDuration(level.timeSeconds) })}</p>

                        {level.specialCosts && level.specialCosts.length > 0 ? (
                          <ul className="tag-list tag-list--compact">
                            {level.specialCosts.map((specialCost) => (
                              <li key={`${level.rowId}-special-${specialCost.itemId}`}>
                                {t('planner.specialCostSummary', {
                                  name: resolveSpecialCostName(specialCost.itemName, specialCost.itemId, t),
                                  value: formatCount(locale, specialCost.amount),
                                })}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {level.prerequisites.length > 0 ? (
                          <ul className="tag-list tag-list--compact">
                            {level.prerequisites.map((requirement) => {
                              const requiredTech = techs.find((tech) => tech.id === requirement.techId)
                              const label = requiredTech
                                ? resolveGameText(gameString, requiredTech.nameKey, requiredTech.name)
                                : `#${requirement.techId}`

                              return <li key={`${level.rowId}-${requirement.techId}`}>{`${label} Lv.${requirement.level}`}</li>
                            })}
                          </ul>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
