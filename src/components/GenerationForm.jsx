import { useState } from 'react'
import { Zap } from 'lucide-react'
import { dataManager } from '../lib/dataManager'
import { getPermaNo } from '../lib/snGenerator'

export default function GenerationForm({ skus, onGenerated }) {
  const [selectedSku, setSelectedSku] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedSkuData = skus.find(s => s.sku === selectedSku)
  const permaNo = getPermaNo()

  const handleGenerate = async () => {
    if (!selectedSku) {
      setError('Please select an SKU')
      return
    }

    const qty = parseInt(quantity)
    if (!qty || qty < 1) {
      setError('Please enter a valid quantity (minimum 1)')
      return
    }

    if (qty > 10000) {
      setError('Maximum 10,000 SNs per batch')
      return
    }

    setError('')
    setLoading(true)

    try {
      const serialNumbers = await dataManager.generateSNBatch(selectedSku, qty)
      onGenerated(serialNumbers)
      setQuantity('')
    } catch (err) {
      console.error('Generation failed:', err)
      setError(err.message || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '28px' }}>
      <div className="section-header">
        <h2 className="section-title">Generate Serial Numbers</h2>
        <p className="section-subtitle">Select an SKU and specify the quantity to generate</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* SKU Select */}
        <div className="form-group">
          <label className="form-label">SKU</label>
          <select
            className="form-select"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            <option value="">Select an SKU...</option>
            {skus.map(s => (
              <option key={s.sku} value={s.sku}>{s.sku}</option>
            ))}
          </select>
        </div>

        {/* Precursor (read-only) */}
        <div className="form-group">
          <label className="form-label">Precursor</label>
          <input
            type="text"
            className="form-input readonly"
            value={selectedSkuData ? selectedSkuData.precursor : '—'}
            readOnly
            tabIndex={-1}
          />
        </div>

        {/* Perma No (auto-generated, read-only) */}
        <div className="form-group">
          <label className="form-label">Perma No (Today)</label>
          <input
            type="text"
            className="form-input readonly"
            value={permaNo}
            readOnly
            tabIndex={-1}
          />
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input
            type="number"
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g., 10"
            min="1"
            max="10000"
          />
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--color-accent-red)', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
          {error}
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Generating...
          </>
        ) : (
          <>
            <Zap size={16} />
            Generate Serial Numbers
          </>
        )}
      </button>
    </div>
  )
}
