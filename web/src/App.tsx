import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
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
  itemNameKey: number
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
  parentId: number
  childId: number
  fromX: number
  fromY: number
  toX: number
  toY: number
}

const RESEARCH_SPEED_STORAGE_KEY = 'lmt-research-speed'
const CURRENT_LEVELS_STORAGE_KEY = 'lmt-current-levels'
const TARGET_LEVELS_STORAGE_KEY = 'lmt-target-levels'
const SELECTED_KIND_STORAGE_KEY = 'lmt-selected-kind'
const PROJECT_REPO_URL = 'https://github.com/kiletw/LordsMobileTechTree'
const PROJECT_ISSUES_URL = `${PROJECT_REPO_URL}/issues`
const AUTHOR_PROFILE_URL = 'https://github.com/kiletw'
const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev'
const ASSET_VERSION = encodeURIComponent(APP_VERSION)
const COMPACT_QUERY = '(max-width: 860px)'

function subscribeToCompactQuery(onChange: () => void) {
  const media = window.matchMedia(COMPACT_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getCompactSnapshot() {
  return window.matchMedia(COMPACT_QUERY).matches
}

function formatCompactCount(locale: string, value: number) {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

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

function resolveSpecialCostName(
  gameString: (id: number) => string,
  itemNameKey: number,
  itemName: string | null,
  itemId: number,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const translatedName = itemNameKey > 0 ? resolveGameText(gameString, itemNameKey, itemName) : itemName

  return translatedName && translatedName.trim().length > 0
    ? translatedName
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

function formatScaledPercent(locale: string, scaledValue: number) {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: scaledValue >= 10 ? 0 : 1,
    maximumFractionDigits: scaledValue >= 10 ? 2 : 2,
  })

  return `${formatter.format(scaledValue)}%`
}

function normalizeEffectValue(rawValue: number, effect: EffectEntry | undefined) {
  if (isPercentLikeEffect(effect)) {
    return rawValue / 100
  }

  return rawValue
}

function formatNormalizedEffectValue(locale: string, value: number, effect: EffectEntry | undefined) {
  if (isPercentLikeEffect(effect)) {
    return formatScaledPercent(locale, value)
  }

  return formatCount(locale, value)
}

function formatEffectDisplayValue(
  locale: string,
  rawValue: number,
  effect: EffectEntry | undefined,
) {
  return formatNormalizedEffectValue(locale, normalizeEffectValue(rawValue, effect), effect)
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
  return level.powerGain - (previousLevel?.powerGain ?? 0)
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

function getStoredCurrentLevel(levelMap: Record<number, number>, tech: TechEntry) {
  if (!isPlannerSupported(tech)) {
    return 0
  }

  const value = levelMap[tech.id] ?? 0
  return Math.min(Math.max(value, 0), tech.maxLevel)
}

function getStoredTargetLevel(levelMap: Record<number, number>, tech: TechEntry, currentLevel: number) {
  if (!isPlannerSupported(tech)) {
    return 0
  }

  const rawTarget = levelMap[tech.id]
  if (rawTarget === undefined) {
    return currentLevel
  }

  return Math.min(Math.max(rawTarget, currentLevel), tech.maxLevel)
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
  const { gameString, locale, t } = useI18n()
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
  const isCompact = useSyncExternalStore(subscribeToCompactQuery, getCompactSnapshot, () => false)

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
        const res = await fetch(`${import.meta.env.BASE_URL}tech/TechData.json?v=${ASSET_VERSION}`)
        if (!res.ok) {
          throw new Error('Failed to load tech dataset')
        }

        const data = (await res.json()) as TechDataset
        let effectData: EffectEntry[] = []

        try {
          const effectRes = await fetch(`${import.meta.env.BASE_URL}Effect.json?v=${ASSET_VERSION}`)
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
  const techById = new Map(techs.map((tech) => [tech.id, tech]))
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

  const treeNodeWidth = 168
  const treeNodeHeight = 80
  const treeNodeCellWidth = 200
  const treeNodeCellHeight = 132
  const treeNodeYInset = 8
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
        x: rowOffsetX + (card.column * treeNodeCellWidth) + ((treeNodeCellWidth - treeNodeWidth) / 2),
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
        parentId: dependencyId,
        childId: tech.id,
        fromX: sourcePosition.x + (treeNodeWidth / 2),
        fromY: sourcePosition.y + treeNodeHeight,
        toX: targetPosition.x + (treeNodeWidth / 2),
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
    return getStoredCurrentLevel(currentLevels, tech)
  }

  function getTargetLevel(tech: TechEntry, currentLevel: number) {
    return getStoredTargetLevel(targetLevels, tech, currentLevel)
  }

  function applyRequiredCurrentLevels(
    tech: TechEntry,
    desiredLevel: number,
    nextCurrentLevels: Record<number, number>,
    nextTargetLevels: Record<number, number>,
    processedRequirementLevelByTechId: Map<number, number>,
  ) {
    if (!isPlannerSupported(tech)) {
      return
    }

    const clampedLevel = Math.min(Math.max(desiredLevel, 0), tech.maxLevel)
    const previousProcessedLevel = processedRequirementLevelByTechId.get(tech.id) ?? 0

    if (getStoredCurrentLevel(nextCurrentLevels, tech) < clampedLevel) {
      nextCurrentLevels[tech.id] = clampedLevel
    }

    const nextCurrentLevel = getStoredCurrentLevel(nextCurrentLevels, tech)
    if (getStoredTargetLevel(nextTargetLevels, tech, nextCurrentLevel) < nextCurrentLevel) {
      nextTargetLevels[tech.id] = nextCurrentLevel
    }

    if (previousProcessedLevel >= clampedLevel) {
      return
    }

    processedRequirementLevelByTechId.set(tech.id, clampedLevel)

    for (const level of tech.levels) {
      if (level.level <= previousProcessedLevel || level.level > clampedLevel) {
        continue
      }

      for (const requirement of level.prerequisites) {
        const requiredTech = techById.get(requirement.techId)
        if (!requiredTech || requiredTech.id === tech.id) {
          continue
        }

        applyRequiredCurrentLevels(
          requiredTech,
          requirement.level,
          nextCurrentLevels,
          nextTargetLevels,
          processedRequirementLevelByTechId,
        )
      }
    }
  }

  function applyRequiredTargetLevels(
    tech: TechEntry,
    desiredLevel: number,
    nextTargetLevels: Record<number, number>,
    processedRequirementLevelByTechId: Map<number, number>,
  ) {
    if (!isPlannerSupported(tech)) {
      return
    }

    const currentLevel = getStoredCurrentLevel(currentLevels, tech)
    const clampedLevel = Math.min(Math.max(desiredLevel, currentLevel), tech.maxLevel)
    if (getStoredTargetLevel(nextTargetLevels, tech, currentLevel) < clampedLevel) {
      nextTargetLevels[tech.id] = clampedLevel
    }

    const nextTargetLevel = getStoredTargetLevel(nextTargetLevels, tech, currentLevel)
    const previousProcessedLevel = processedRequirementLevelByTechId.get(tech.id) ?? currentLevel
    if (previousProcessedLevel >= nextTargetLevel) {
      return
    }

    processedRequirementLevelByTechId.set(tech.id, nextTargetLevel)

    for (const level of tech.levels) {
      if (level.level <= previousProcessedLevel || level.level > nextTargetLevel) {
        continue
      }

      for (const requirement of level.prerequisites) {
        const requiredTech = techById.get(requirement.techId)
        if (!requiredTech || requiredTech.id === tech.id) {
          continue
        }

        applyRequiredTargetLevels(
          requiredTech,
          requirement.level,
          nextTargetLevels,
          processedRequirementLevelByTechId,
        )
      }
    }
  }

  function updateCurrentLevel(tech: TechEntry, nextValue: number) {
    if (!isPlannerSupported(tech)) {
      return
    }

    const nextCurrent = Math.min(Math.max(nextValue, 0), tech.maxLevel)
    const nextCurrentLevels = { ...currentLevels, [tech.id]: nextCurrent }
    const nextTargetLevels = {
      ...targetLevels,
      [tech.id]: Math.max(getTargetLevel(tech, getCurrentLevel(tech)), nextCurrent),
    }

    applyRequiredCurrentLevels(
      tech,
      nextCurrent,
      nextCurrentLevels,
      nextTargetLevels,
      new Map<number, number>(),
    )

    setCurrentLevels(nextCurrentLevels)
    setTargetLevels(nextTargetLevels)
  }

  function updateTargetLevel(tech: TechEntry, nextValue: number) {
    if (!isPlannerSupported(tech)) {
      return
    }

    const currentLevel = getCurrentLevel(tech)
    const nextTarget = Math.min(Math.max(nextValue, currentLevel), tech.maxLevel)
    const nextTargetLevels = { ...targetLevels, [tech.id]: nextTarget }

    applyRequiredTargetLevels(
      tech,
      nextTarget,
      nextTargetLevels,
      new Map<number, number>(),
    )

    setTargetLevels(nextTargetLevels)
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
  const specialCostTotals = new Map<number, { itemId: number; itemNameKey: number; itemName: string | null; amount: number }>()

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
        const effectMeta = effectById.get(targetEffect.effectId)
        const normalizedDelta = normalizeEffectValue(delta, effectMeta)
        effectDeltas.set(targetEffect.effectId, (effectDeltas.get(targetEffect.effectId) ?? 0) + normalizedDelta)
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
          itemNameKey: specialCost.itemNameKey,
          itemName: specialCost.itemName,
          amount: (existingTotal?.amount ?? 0) + specialCost.amount,
        })
      }

      for (const requirement of level.prerequisites) {
        const requiredTech = techById.get(requirement.techId)
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

  const plannedCountByKindId = new Map<number, number>()
  const techCountByKindId = new Map<number, number>()
  for (const tech of techs) {
    techCountByKindId.set(tech.kindId, (techCountByKindId.get(tech.kindId) ?? 0) + 1)

    if (isPlannerSupported(tech)) {
      const techCurrentLevel = getCurrentLevel(tech)
      if (getTargetLevel(tech, techCurrentLevel) > techCurrentLevel) {
        plannedCountByKindId.set(tech.kindId, (plannedCountByKindId.get(tech.kindId) ?? 0) + 1)
      }
    }
  }

  function getUnmetUnlockRequirements(tech: TechEntry) {
    const unlockLevel = getUnlockLevel(tech)
    const unmet: string[] = []

    for (const requirement of unlockLevel?.prerequisites ?? []) {
      const requiredTech = techById.get(requirement.techId)
      if (!requiredTech || requiredTech.id === tech.id) {
        continue
      }

      const requiredCurrent = getCurrentLevel(requiredTech)
      if (getTargetLevel(requiredTech, requiredCurrent) < requirement.level) {
        unmet.push(`${resolveGameText(gameString, requiredTech.nameKey, requiredTech.name)} Lv.${requirement.level}`)
      }
    }

    return unmet
  }

  const adjustedTimeSeconds = Math.ceil(totalTimeSeconds * researchTimeFactor)
  const effectSummary = Array.from(effectDeltas.entries())
    .sort((left, right) => left[0] - right[0])
  const specialCostSummary = Array.from(specialCostTotals.values())
    .sort((left, right) => left.itemId - right.itemId)

  const resourceTotals = [
    { key: 'food', label: t('planner.resource.food'), value: totalFood },
    { key: 'stone', label: t('planner.resource.stone'), value: totalStone },
    { key: 'wood', label: t('planner.resource.wood'), value: totalWood },
    { key: 'iron', label: t('planner.resource.iron'), value: totalIron },
    { key: 'gold', label: t('planner.resource.gold'), value: totalGold },
  ]

  const activeKind = kinds.find((kind) => kind.id === activeKindId) ?? null
  const selectedCurrentLevel = selectedTech ? getCurrentLevel(selectedTech) : 0
  const selectedTargetLevel = selectedTech ? getTargetLevel(selectedTech, selectedCurrentLevel) : 0
  const selectedUnlockLevel = selectedTech && isPlannerSupported(selectedTech) ? getUnlockLevel(selectedTech) : null
  const selectedEffectMeta = selectedUnlockLevel
    ? resolveEffectMeta(selectedUnlockLevel.effectId, effectById, gameString, t)
    : null
  const selectedAcademyLevel = selectedTech
    ? selectedTech.levels.reduce(
        (highest, level) => (level.level > selectedCurrentLevel && level.level <= selectedTargetLevel
          ? Math.max(highest, level.academyLevel)
          : highest),
        0,
      )
    : 0

  function renderTechNode(tech: TechEntry, style?: CSSProperties) {
    const currentLevel = getCurrentLevel(tech)
    const targetLevel = getTargetLevel(tech, currentLevel)
    const plannerSupported = isPlannerSupported(tech)
    const isPlanned = targetLevel > currentLevel
    const unmetRequirements = plannerSupported && targetLevel === 0 ? getUnmetUnlockRequirements(tech) : []
    const isLocked = unmetRequirements.length > 0
    const label = resolveGameText(gameString, tech.nameKey, tech.name)
    const levelText = isPlanned ? `${currentLevel}→${targetLevel}` : String(currentLevel)
    const classNames = [
      'node',
      isPlanned ? 'is-planned' : '',
      isLocked ? 'is-locked' : '',
      plannerSupported ? '' : 'is-catalog',
      tech.id === selectedTech?.id ? 'is-selected' : '',
    ].filter(Boolean).join(' ')

    return (
      <button
        key={tech.id}
        type="button"
        className={classNames}
        style={style}
        title={isLocked ? `${t('planner.missingRequirements')}: ${unmetRequirements.join(', ')}` : label}
        aria-pressed={tech.id === selectedTech?.id}
        onClick={() => setSelectedTechId(tech.id)}
      >
        <span className="node-name">{label}</span>
        <span className="node-meter">
          {plannerSupported ? (
            <>
              <span className="pips" aria-hidden="true">
                {Array.from({ length: tech.maxLevel }, (_, index) => (
                  <i
                    key={index}
                    className={index < currentLevel ? 'is-current' : index < targetLevel ? 'is-planned' : ''}
                  />
                ))}
              </span>
              <span className="lv" dir="ltr">{levelText}</span>
            </>
          ) : (
            <span className="node-badge">{t('planner.catalogOnlyBadge')}</span>
          )}
        </span>
      </button>
    )
  }

  function renderStepper(
    label: string,
    value: number,
    minLevel: number,
    maxLevel: number,
    onChange: (nextValue: number) => void,
  ) {
    return (
      <div className="step" role="group" aria-label={label}>
        <span>{label}</span>
        <div className="stepper">
          <button type="button" aria-label={`${label} −`} disabled={value <= minLevel} onClick={() => onChange(value - 1)}>
            −
          </button>
          <select aria-label={label} value={value} onChange={(event) => onChange(Number(event.target.value))}>
            {Array.from({ length: maxLevel + 1 }, (_, level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <button type="button" aria-label={`${label} +`} disabled={value >= maxLevel} onClick={() => onChange(value + 1)}>
            +
          </button>
        </div>
      </div>
    )
  }

  const litEdges = techTreeEdges.map((edge) => {
    const parent = techById.get(edge.parentId)
    const child = techById.get(edge.childId)
    const childCurrent = child ? getCurrentLevel(child) : 0
    const parentCurrent = parent ? getCurrentLevel(parent) : 0
    const isLit = Boolean(
      parent && child
      && isPlannerSupported(child)
      && getTargetLevel(child, childCurrent) > childCurrent
      && getTargetLevel(parent, parentCurrent) > 0,
    )

    return { edge, isLit }
  }).sort((left, right) => Number(left.isLit) - Number(right.isLit))

  const treeContent = hasLoadError ? (
    <p className="empty-state">{t('planner.error')}</p>
  ) : isLoading ? (
    <p className="empty-state">{t('planner.loading')}</p>
  ) : techs.length === 0 ? (
    <p className="empty-state">{t('planner.datasetMissing')}</p>
  ) : visibleTechs.length === 0 ? (
    <p className="empty-state">{t('planner.kindEmpty')}</p>
  ) : isCompact ? (
    <ol className="route">
      {techTreeRows.flatMap((row) => row.cards).map(({ tech }) => {
        const techCurrent = getCurrentLevel(tech)
        const isPlanned = isPlannerSupported(tech) && getTargetLevel(tech, techCurrent) > techCurrent

        return (
          <li
            key={tech.id}
            className={`route-item ${isPlanned ? 'is-planned' : ''}`}
            style={{ '--depth': Math.min(techDepthById.get(tech.id) ?? 0, 3) } as CSSProperties}
          >
            <span className="route-dot" aria-hidden="true" />
            {renderTechNode(tech)}
          </li>
        )
      })}
    </ol>
  ) : (
    <div className="board" style={{ width: `${treeBoardWidth}px`, height: `${treeBoardHeight}px` }}>
      <svg
        className="board-edges"
        width={treeBoardWidth}
        height={treeBoardHeight}
        viewBox={`0 0 ${treeBoardWidth} ${treeBoardHeight}`}
        aria-hidden="true"
      >
        {litEdges.map(({ edge, isLit }) => {
          const controlY = edge.fromY + ((edge.toY - edge.fromY) * 0.5)

          return (
            <path
              key={`${edge.key}:${isLit ? 'lit' : 'idle'}`}
              d={`M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${controlY}, ${edge.toX} ${controlY}, ${edge.toX} ${edge.toY}`}
              className={isLit ? 'edge is-lit' : 'edge'}
              pathLength={1}
            />
          )
        })}
      </svg>

      {techTreeRows.flatMap((row) => row.cards).map(({ tech }) => {
        const position = cardPositionByTechId.get(tech.id)
        return renderTechNode(tech, position ? { left: position.x, top: position.y } : undefined)
      })}
    </div>
  )

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">{t('app.title')}</h1>

        <label className="field">
          <span>{t('planner.researchSpeed')}</span>
          <input
            type="number"
            inputMode="decimal"
            value={researchSpeedBonus}
            title={t('planner.researchSpeedHelp')}
            onChange={(event) => setResearchSpeedBonus(event.target.value)}
          />
        </label>

        <LanguageSwitcher />
      </header>

      <main>
        <div className="workspace">
          <nav className="rail" aria-label={t('planner.kindColumn')}>
            {kinds.map((kind) => {
              const plannedCount = plannedCountByKindId.get(kind.id) ?? 0

              return (
                <button
                  key={kind.id}
                  type="button"
                  aria-current={kind.id === activeKindId ? 'true' : undefined}
                  onClick={() => setSelectedKindId(kind.id)}
                >
                  <span>{resolveGameText(gameString, kind.nameKey, kind.name)}</span>
                  <span className={`count ${plannedCount > 0 ? 'has-plan' : ''}`} dir="ltr">
                    {plannedCount}/{techCountByKindId.get(kind.id) ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>

          <section className="canvas" aria-label={t('planner.techColumn')}>
            <div className="canvas-bar">
              <h2>{activeKind ? resolveGameText(gameString, activeKind.nameKey, activeKind.name) : t('planner.browserTitle')}</h2>
              <div className="canvas-actions">
                <button type="button" className="btn" onClick={syncTargetsToCurrent}>
                  {t('planner.syncTargets')}
                </button>
                <button type="button" className="btn" onClick={resetPlanner}>
                  {t('planner.resetPlanner')}
                </button>
              </div>
            </div>
            <div className="canvas-scroll">{treeContent}</div>
          </section>

          <aside className="inspector" aria-label={t('planner.selectedTech')}>
            {!selectedTech ? (
              <p className="empty-state inspector-empty">{t('planner.noSelectedTech')}</p>
            ) : (
              <>
                <div className="insp-edit">
                  <h2 className="insp-title">{resolveGameText(gameString, selectedTech.nameKey, selectedTech.name)}</h2>

                  {isPlannerSupported(selectedTech) ? (
                    <>
                      <div className="steps">
                        {renderStepper(
                          t('planner.currentLevel'),
                          selectedCurrentLevel,
                          0,
                          selectedTech.maxLevel,
                          (nextValue) => updateCurrentLevel(selectedTech, nextValue),
                        )}
                        {renderStepper(
                          t('planner.targetLevel'),
                          selectedTargetLevel,
                          selectedCurrentLevel,
                          selectedTech.maxLevel,
                          (nextValue) => updateTargetLevel(selectedTech, nextValue),
                        )}
                      </div>
                      {selectedAcademyLevel > 0 ? (
                        <p className="insp-need">{t('planner.maxAcademy')}: Lv.{selectedAcademyLevel}</p>
                      ) : null}
                    </>
                  ) : (
                    <p className="insp-note">
                      {selectedTech.supplementalLevelCount > 0
                        ? t('planner.catalogOnlyDetail', { count: selectedTech.supplementalLevelCount })
                        : t('planner.missingTechDetail')}
                    </p>
                  )}
                </div>

                {isPlannerSupported(selectedTech) ? (
                  <div className="insp-levels">
                    {selectedEffectMeta ? (
                      <div className="insp-effect">
                        <p>{selectedEffectMeta.name}</p>
                        {selectedEffectMeta.description ? <p>{selectedEffectMeta.description}</p> : null}
                      </div>
                    ) : null}

                    <ol className="levels">
                      {selectedTech.levels.map((level) => {
                        const isReached = level.level <= selectedCurrentLevel
                        const isPlanned = level.level > selectedCurrentLevel && level.level <= selectedTargetLevel
                        const effectMeta = resolveEffectMeta(level.effectId, effectById, gameString, t)
                        const effectDelta = getEffectDelta(selectedTech.levels, level)
                        const powerGain = getGamePagePowerDelta(selectedTech.levels, level)

                        return (
                          <li
                            key={level.rowId}
                            className={`level ${isReached ? 'is-reached' : ''} ${isPlanned ? 'is-planned' : ''}`}
                          >
                            <span className="level-n" title={t('planner.levelTitle', { level: level.level })}>{level.level}</span>
                            <span className="level-time" title={t('planner.timeLabel', { value: formatDuration(level.timeSeconds) })}>
                              {formatDuration(level.timeSeconds)}
                            </span>
                            <span className="level-power" title={t('planner.gamePagePowerLabel', { value: formatCount(locale, powerGain) })}>
                              +{formatCount(locale, powerGain)}
                            </span>

                            <p className="level-meta">
                              <span>{t('planner.academyLabel', { value: level.academyLevel })}</span>
                              <span>{t('planner.effectValueLabel', { value: formatEffectDisplayValue(locale, level.effectValue, effectMeta.effect) })}</span>
                              <span>{t('planner.effectDeltaLabel', { value: formatEffectDisplayValue(locale, effectDelta, effectMeta.effect) })}</span>
                            </p>

                            {(level.prerequisites.length > 0 || (level.specialCosts?.length ?? 0) > 0) ? (
                              <ul className="level-tags">
                                {level.prerequisites.map((requirement) => {
                                  const requiredTech = techById.get(requirement.techId)
                                  const requirementLabel = requiredTech
                                    ? resolveGameText(gameString, requiredTech.nameKey, requiredTech.name)
                                    : `#${requirement.techId}`

                                  return <li key={`${level.rowId}-req-${requirement.techId}`}>{`${requirementLabel} Lv.${requirement.level}`}</li>
                                })}
                                {(level.specialCosts ?? []).map((specialCost) => (
                                  <li key={`${level.rowId}-special-${specialCost.itemId}`}>
                                    {t('planner.specialCostSummary', {
                                      name: resolveSpecialCostName(gameString, specialCost.itemNameKey, specialCost.itemName, specialCost.itemId, t),
                                      value: formatCount(locale, specialCost.amount),
                                    })}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                ) : null}
              </>
            )}
          </aside>
        </div>

        <section className="details" id="plan-details" aria-labelledby="plan-details-title">
          <h2 id="plan-details-title">{t('planner.summaryTitle')}</h2>

          <dl className="stats">
            <div><dt>{t('planner.plannedTechs')}</dt><dd>{formatCount(locale, plannedTechCount)}</dd></div>
            <div><dt>{t('planner.plannedLevels')}</dt><dd>{formatCount(locale, plannedLevelCount)}</dd></div>
            <div><dt>{t('planner.totalTime')}</dt><dd>{formatDuration(totalTimeSeconds)}</dd></div>
            <div><dt>{t('planner.totalTimeAdjusted')}</dt><dd>{formatDuration(adjustedTimeSeconds)}</dd></div>
            {resourceTotals.map((resource) => (
              <div key={resource.key}><dt>{resource.label}</dt><dd>{formatCount(locale, resource.value)}</dd></div>
            ))}
          </dl>

          <div className="detail-columns">
            <section>
              <h3>{t('planner.specialCosts')}</h3>
              {specialCostSummary.length === 0 ? (
                <p className="empty-state">{t('planner.noSpecialCosts')}</p>
              ) : (
                <ul className="rows">
                  {specialCostSummary.map((specialCost) => (
                    <li key={specialCost.itemId}>
                      <span>{resolveSpecialCostName(gameString, specialCost.itemNameKey, specialCost.itemName, specialCost.itemId, t)}</span>
                      <strong>{formatCount(locale, specialCost.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3>{t('planner.missingRequirements')}</h3>
              {missingRequirements.size === 0 ? (
                <p className="empty-state">{t('planner.noMissingRequirements')}</p>
              ) : (
                <ul className="rows">
                  {Array.from(missingRequirements.values()).slice(0, 10).map((item) => (
                    <li key={item}><span>{item}</span></li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3>{t('planner.effectSummary')}</h3>
              {effectSummary.length === 0 ? (
                <p className="empty-state">{t('planner.noEffectChanges')}</p>
              ) : (
                <ul className="rows">
                  {effectSummary.map(([effectId, value]) => {
                    const effectMeta = resolveEffectMeta(effectId, effectById, gameString, t)

                    return (
                      <li key={effectId}>
                        <span>
                          {formatEffectMetricLabel(
                            effectMeta.name,
                            formatNormalizedEffectValue(locale, value, effectMeta.effect),
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <section>
            <h2>{t('footer.title')}</h2>
            <p>{t('footer.description')}</p>
            <p className="site-footer__version">
              {t('planner.metric.datasetVersion', { version: APP_VERSION === 'dev' ? (dataset?.version ?? APP_VERSION) : APP_VERSION.slice(0, 7) })}
            </p>
          </section>

          <nav className="site-footer__links" aria-label={t('footer.title')}>
            <a href={PROJECT_REPO_URL} target="_blank" rel="noreferrer">{t('footer.github')}</a>
            <a href={PROJECT_ISSUES_URL} target="_blank" rel="noreferrer">{t('footer.issues')}</a>
            <a href={AUTHOR_PROFILE_URL} target="_blank" rel="noreferrer">{t('footer.authorProfile')}</a>
          </nav>

          <section className="site-footer__notes">
            <p><strong>{t('footer.maintainedBy', { name: 'kiletw' })}</strong></p>
            <p>{t('footer.dataSource')}</p>
            <p>{t('footer.localeCoverage')}</p>
            <p>{t('footer.disclaimer')}</p>
          </section>
        </div>
      </footer>

      <section className="ledger" aria-label={t('planner.summaryTitle')}>
        <div className="ledger-power">
          <strong className="big">+{formatCount(locale, totalGamePagePower)}</strong>
          <small>{t('planner.totalGamePagePower')}</small>
        </div>

        <div className="ledger-time">
          <strong className="big">{formatDuration(adjustedTimeSeconds)}</strong>
          <small>{t('planner.totalTimeAdjusted')}</small>
        </div>

        <ul className="ledger-res">
          {resourceTotals.map((resource) => (
            <li key={resource.key} className={`res-${resource.key}`} title={formatCount(locale, resource.value)}>
              <span>{resource.label}</span>
              <strong>{formatCompactCount(locale, resource.value)}</strong>
            </li>
          ))}
        </ul>

        <div className="ledger-flags">
          {maxAcademyLevel > 0 ? (
            <span className="flag">{t('planner.maxAcademy')} Lv.{maxAcademyLevel}</span>
          ) : null}
          {missingRequirements.size > 0 ? (
            <a className="flag flag--missing" href="#plan-details">
              {t('planner.missingRequirements')} {missingRequirements.size}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default App
