import initialDbData from '../data/db.json'
import { getPermaNo, generateRandomSequence, generateSerialNumbers } from './snGenerator'

const LOCAL_STORAGE_KEY = 'fsn_database_v1'
const GITHUB_CONFIG_KEY = 'fsn_github_config_v1'

/**
 * Loads current database from localStorage or initializes from db.json
 */
function loadDatabase() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && Array.isArray(parsed.sku_ledger) && Array.isArray(parsed.generation_history)) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed to load from localStorage, falling back to initial db.json:', err)
  }

  // Fallback to imported seed data
  return initialDbData
}

/**
 * Saves database state to localStorage
 */
function saveDatabase(db) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db))
  } catch (err) {
    console.error('Failed to save database to localStorage:', err)
  }
}

/**
 * Core Data Manager API
 */
export const dataManager = {
  /**
   * Get all SKUs sorted by SKU code
   */
  getSKUs() {
    const db = loadDatabase()
    return [...db.sku_ledger].sort((a, b) => a.sku.localeCompare(b.sku))
  },

  /**
   * Get generation history sorted newest first
   */
  getHistory() {
    const db = loadDatabase()
    return [...db.generation_history].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  },

  /**
   * Generate a batch of serial numbers for a given SKU and quantity
   */
  async generateSNBatch(skuCode, quantity) {
    const db = loadDatabase()
    const skuIndex = db.sku_ledger.findIndex(s => s.sku === skuCode)
    if (skuIndex === -1) {
      throw new Error(`SKU "${skuCode}" not found in ledger`)
    }

    const skuItem = db.sku_ledger[skuIndex]
    const currentFlow = skuItem.current_flow_number || 0
    const startFlow = currentFlow + 1
    const endFlow = currentFlow + quantity

    const permaNo = getPermaNo()
    const randomSeq = generateRandomSequence()
    const serialNumbers = generateSerialNumbers(
      skuItem.precursor,
      permaNo,
      randomSeq,
      startFlow,
      endFlow
    )

    const now = new Date().toISOString()

    // 1. Update SKU ledger
    db.sku_ledger[skuIndex] = {
      ...skuItem,
      current_flow_number: endFlow,
      last_perma_no: permaNo,
      last_random_sequence: randomSeq,
      updated_at: now
    }

    // 2. Insert history record
    const historyRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      sku: skuCode,
      quantity_generated: quantity,
      starting_sn: serialNumbers[0],
      ending_sn: serialNumbers[serialNumbers.length - 1],
      serial_numbers: serialNumbers.join(', '),
      created_at: now
    }

    db.generation_history.unshift(historyRecord)

    // Save locally
    saveDatabase(db)

    // Try background GitHub sync if token configured
    this.syncWithGitHub().catch(err => {
      console.warn('Background GitHub sync failed:', err.message)
    })

    return serialNumbers
  },

  /**
   * Update SKU precursor or flow number
   */
  async updateSKU(skuCode, fields) {
    const db = loadDatabase()
    const skuIndex = db.sku_ledger.findIndex(s => s.sku === skuCode)
    if (skuIndex === -1) {
      throw new Error(`SKU "${skuCode}" not found`)
    }

    db.sku_ledger[skuIndex] = {
      ...db.sku_ledger[skuIndex],
      ...fields,
      updated_at: new Date().toISOString()
    }

    saveDatabase(db)

    // Try background GitHub sync
    this.syncWithGitHub().catch(err => {
      console.warn('Background GitHub sync failed:', err.message)
    })
  },

  /**
   * Export database as downloadable JSON file
   */
  exportJSON() {
    const db = loadDatabase()
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fsn_database_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  /**
   * Import database from JSON string
   */
  importJSON(jsonString) {
    const parsed = JSON.parse(jsonString)
    if (!parsed || !Array.isArray(parsed.sku_ledger) || !Array.isArray(parsed.generation_history)) {
      throw new Error('Invalid JSON format: missing sku_ledger or generation_history arrays')
    }

    saveDatabase(parsed)
    this.syncWithGitHub().catch(err => {
      console.warn('Background GitHub sync failed:', err.message)
    })
    return parsed
  },

  /**
   * GitHub REST API Configuration Management
   */
  getGitHubConfig() {
    try {
      const stored = localStorage.getItem(GITHUB_CONFIG_KEY)
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load GitHub config:', e)
    }

    return {
      owner: '',
      repo: '',
      branch: 'main',
      path: 'src/data/db.json',
      token: ''
    }
  },

  saveGitHubConfig(config) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config))
  },

  /**
   * Sync data to GitHub repository via REST API
   */
  async syncWithGitHub() {
    const config = this.getGitHubConfig()
    if (!config.owner || !config.repo || !config.token) {
      return { success: false, message: 'GitHub configuration incomplete' }
    }

    const path = config.path || 'src/data/db.json'
    const branch = config.branch || 'main'
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${branch}`

    const headers = {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }

    // 1. Get existing file sha if it exists
    let sha = null
    try {
      const getRes = await fetch(url, { headers })
      if (getRes.ok) {
        const fileData = await getRes.json()
        sha = fileData.sha
      }
    } catch (e) {
      console.log('File does not exist on GitHub yet, creating new file.')
    }

    // 2. Encode current database to Base64 (Unicode safe)
    const db = loadDatabase()
    const jsonStr = JSON.stringify(db, null, 2)
    const bytes = new TextEncoder().encode(jsonStr)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const contentBase64 = btoa(binary)

    // 3. Commit/Push file via PUT request
    const putUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`
    const body = {
      message: `[FSN] Update serial number database (${new Date().toISOString()})`,
      content: contentBase64,
      branch: branch,
      ...(sha ? { sha } : {})
    }

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    })

    if (!putRes.ok) {
      const errorJson = await putRes.json()
      throw new Error(errorJson.message || `GitHub API error: ${putRes.statusText}`)
    }

    const result = await putRes.json()
    return { success: true, commitSha: result.commit.sha }
  },

  /**
   * Pull latest data from GitHub repository
   */
  async pullFromGitHub() {
    const config = this.getGitHubConfig()
    if (!config.owner || !config.repo || !config.token) {
      throw new Error('GitHub token and repository details are required')
    }

    const path = config.path || 'src/data/db.json'
    const branch = config.branch || 'main'
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${branch}`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Failed to fetch file from GitHub')
    }

    const data = await res.json()
    const decodedContent = new TextDecoder().decode(
      Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0))
    )

    return this.importJSON(decodedContent)
  }
}
