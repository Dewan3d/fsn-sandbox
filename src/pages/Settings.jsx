import { useState, useEffect, useCallback, useRef } from 'react'
import { dataManager } from '../lib/dataManager'
import SkuTable from '../components/SkuTable'
import {
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  Database
} from 'lucide-react'

export default function Settings() {
  const [skus, setSkus] = useState([])
  const [loading, setLoading] = useState(true)

  // GitHub Config State
  const [ghOwner, setGhOwner] = useState('')
  const [ghRepo, setGhRepo] = useState('')
  const [ghBranch, setGhBranch] = useState('main')
  const [ghPath, setGhPath] = useState('src/data/db.json')
  const [ghToken, setGhToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  
  const [ghSaving, setGhSaving] = useState(false)
  const [ghSyncing, setGhSyncing] = useState(false)
  const [ghPulling, setGhPulling] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null) // { type: 'success' | 'error', text: '' }

  const fileInputRef = useRef(null)

  const fetchSkus = useCallback(() => {
    try {
      const data = dataManager.getSKUs()
      if (data) setSkus(data)
    } catch (err) {
      console.error('Failed to fetch SKUs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkus()

    // Load GitHub Config
    const config = dataManager.getGitHubConfig()
    setGhOwner(config.owner || '')
    setGhRepo(config.repo || '')
    setGhBranch(config.branch || 'main')
    setGhPath(config.path || 'src/data/db.json')
    setGhToken(config.token || '')
  }, [fetchSkus])

  const handleSaveConfig = (e) => {
    e.preventDefault()
    setGhSaving(true)
    try {
      dataManager.saveGitHubConfig({
        owner: ghOwner.trim(),
        repo: ghRepo.trim(),
        branch: ghBranch.trim() || 'main',
        path: ghPath.trim() || 'src/data/db.json',
        token: ghToken.trim()
      })
      setStatusMessage({ type: 'success', text: 'GitHub configuration saved successfully!' })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to save configuration: ' + err.message })
    } finally {
      setGhSaving(false)
    }
  }

  const handleSyncToGitHub = async () => {
    setGhSyncing(true)
    setStatusMessage(null)
    try {
      const res = await dataManager.syncWithGitHub()
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully synced database to GitHub! Commit SHA: ${res.commitSha?.slice(0, 7)}`
        })
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'GitHub sync failed' })
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'GitHub sync failed: ' + err.message })
    } finally {
      setGhSyncing(false)
    }
  }

  const handlePullFromGitHub = async () => {
    setGhPulling(true)
    setStatusMessage(null)
    try {
      await dataManager.pullFromGitHub()
      fetchSkus()
      setStatusMessage({ type: 'success', text: 'Successfully pulled latest database from GitHub!' })
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'GitHub pull failed: ' + err.message })
    } finally {
      setGhPulling(false)
    }
  }

  const handleExportJSON = () => {
    dataManager.exportJSON()
  }

  const handleImportJSONClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const content = evt.target.result
        dataManager.importJSON(content)
        fetchSkus()
        setStatusMessage({ type: 'success', text: 'Database imported successfully!' })
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to import JSON: ' + err.message })
      }
    }
    reader.readAsText(file)
    // reset input
    e.target.value = ''
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure SKU flow numbers, GitHub REST API database sync, and JSON backups.</p>
      </div>

      {statusMessage && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            borderColor:
              statusMessage.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(239, 68, 68, 0.3)',
            backgroundColor:
              statusMessage.type === 'success'
                ? 'rgba(16, 185, 129, 0.05)'
                : 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={20} style={{ color: 'var(--color-accent-emerald, #10b981)' }} />
          ) : (
            <AlertCircle size={20} style={{ color: 'var(--color-accent-red, #ef4444)' }} />
          )}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{statusMessage.text}</span>
        </div>
      )}

      {/* GitHub Sync REST API Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-purple, #8b5cf6)' }}>
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
            <path d="M9 18c-4.51 2-5-2-7-2"></path>
          </svg>
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>GitHub REST API Storage Sync</h2>
            <p className="section-subtitle">
              Sync your serial number database file directly to your GitHub repository.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">GitHub Owner / Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., octocat"
                value={ghOwner}
                onChange={(e) => setGhOwner(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Repository Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., FSN_SANDBOX"
                value={ghRepo}
                onChange={(e) => setGhRepo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target File Path in Repo</label>
              <input
                type="text"
                className="form-input"
                placeholder="src/data/db.json"
                value={ghPath}
                onChange={(e) => setGhPath(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Branch</label>
              <input
                type="text"
                className="form-input"
                placeholder="main"
                value={ghBranch}
                onChange={(e) => setGhBranch(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Personal Access Token (PAT)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showToken ? 'text' : 'password'}
                className="form-input"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="btn btn-icon btn-secondary"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  background: 'transparent'
                }}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px', display: 'block' }}>
              Requires a GitHub Personal Access Token with <code>repo (contents: read/write)</code> scope.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={ghSaving}>
              <Save size={16} />
              {ghSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSyncToGitHub}
              disabled={ghSyncing || !ghToken || !ghOwner || !ghRepo}
            >
              <RefreshCw size={16} className={ghSyncing ? 'spin' : ''} />
              {ghSyncing ? 'Syncing...' : 'Sync to GitHub (Push)'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePullFromGitHub}
              disabled={ghPulling || !ghToken || !ghOwner || !ghRepo}
            >
              <Download size={16} />
              {ghPulling ? 'Pulling...' : 'Pull from GitHub'}
            </button>
          </div>
        </form>
      </div>

      {/* Manual JSON Export / Import Backup Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={22} style={{ color: 'var(--color-accent-blue, #3b82f6)' }} />
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>JSON Backup & Restore</h2>
            <p className="section-subtitle">Export your full database to a JSON backup file or import a previous state.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportJSON}>
            <Download size={16} />
            Export JSON Backup
          </button>

          <button className="btn btn-secondary" onClick={handleImportJSONClick}>
            <Upload size={16} />
            Import JSON Backup
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* SKU Precursors & Flow Numbers Table */}
      <h2 className="section-title" style={{ marginBottom: '12px' }}>SKU Precursors & Flow Numbers</h2>
      <SkuTable skus={skus} onUpdate={fetchSkus} />
    </div>
  )
}
