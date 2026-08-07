const STORAGE_KEYS = Object.freeze({
  records: 'ai3d_evaluation_records',
  settings: 'ai3d_app_settings',
  version: 'ai3d_storage_version',
})

const STORAGE_VERSION = '1.1.0'

const isStorageAvailable = () => {
  try {
    const key = '__ai3d_storage_check__'
    window.localStorage.setItem(key, key)
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const read = (key, fallback) => {
  if (!isStorageAvailable()) return fallback
  return safeParse(window.localStorage.getItem(key), fallback)
}

const write = (key, value) => {
  if (!isStorageAvailable()) return { ok: false, error: 'storage_unavailable' }
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return { ok: true, value }
  } catch {
    return { ok: false, error: 'storage_write_failed' }
  }
}

const createRecordShape = (record = {}) => {
  const now = new Date().toISOString()
  return {
    id: record.id || globalThis.crypto?.randomUUID?.() || `evaluation_${Date.now()}`,
    type: record.type === 'pk' ? 'pk' : 'single',
    createdAt: record.createdAt || now,
    updatedAt: now,
    modelA: record.modelA || null,
    modelB: record.modelB || null,
    scoresA: record.scoresA || null,
    scoresB: record.scoresB || null,
    totalScoreA: record.totalScoreA ?? null,
    totalScoreB: record.totalScoreB ?? null,
    gradeA: record.gradeA || null,
    gradeB: record.gradeB || null,
    winner: record.winner || null,
    comment: record.comment || '',
    rubricVersion: record.rubricVersion || 'UNIVERSAL_RETOPO_V1',
    universalResult: record.universalResult || null,
    specializedResult: record.specializedResult || null,
    gateResult: record.gateResult || null,
    deliveryStatus: record.deliveryStatus || null,
    evaluationState: record.evaluationState || 'not_evaluated',
    productionContext: record.productionContext || null,
    modelReference: record.modelReference || null,
  }
}

export const storageService = {
  keys: STORAGE_KEYS,

  initialize() {
    if (!isStorageAvailable()) return { ok: false, error: 'storage_unavailable' }
    const currentVersion = window.localStorage.getItem(STORAGE_KEYS.version)
    if (currentVersion !== STORAGE_VERSION) window.localStorage.setItem(STORAGE_KEYS.version, STORAGE_VERSION)
    if (!window.localStorage.getItem(STORAGE_KEYS.records)) write(STORAGE_KEYS.records, [])
    if (!window.localStorage.getItem(STORAGE_KEYS.settings)) write(STORAGE_KEYS.settings, {})
    return { ok: true, version: STORAGE_VERSION }
  },

  getRecords() {
    const records = read(STORAGE_KEYS.records, [])
    return Array.isArray(records) ? records : []
  },

  getRecord(id) {
    if (!id) return null
    return this.getRecords().find((record) => record.id === id) || null
  },

  getPendingRecords() {
    return this.getRecords()
      .filter((record) => record.type === 'single' && (record.evaluationState === 'partial_automatic' || record.totalScoreA === null))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  },

  saveRecord(record) {
    const records = this.getRecords()
    const normalized = createRecordShape(record)
    const existingIndex = records.findIndex((item) => item.id === normalized.id)
    if (existingIndex >= 0) {
      normalized.createdAt = records[existingIndex].createdAt || normalized.createdAt
      records[existingIndex] = normalized
    } else {
      records.unshift(normalized)
    }
    const saved = write(STORAGE_KEYS.records, records)
    return { ...saved, record: saved.ok ? normalized : null }
  },

  removeRecord(id) {
    return write(STORAGE_KEYS.records, this.getRecords().filter((record) => record.id !== id))
  },

  getSettings() {
    const settings = read(STORAGE_KEYS.settings, {})
    return settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {}
  },

  saveSettings(settings) {
    return write(STORAGE_KEYS.settings, { ...this.getSettings(), ...settings })
  },

  reset() {
    if (!isStorageAvailable()) return { ok: false, error: 'storage_unavailable' }
    try {
      Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
      return this.initialize()
    } catch {
      return { ok: false, error: 'storage_reset_failed' }
    }
  },
}
