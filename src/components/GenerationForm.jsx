import { useState } from 'react'
import { Zap } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getPermaNo, generateRandomSequence, generateSerialNumbers } from '../lib/snGenerator'

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
      // 1. Call RPC to atomically reserve flow numbers
      const { data: rangeData, error: rpcError } = await supabase
        .rpc('generate_sn_range', {
          p_sku: selectedSku,
          p_quantity: qty
        })

      if (rpcError) throw rpcError
      if (!rangeData || rangeData.length === 0) throw new Error('Failed to reserve flow numbers')

      const { start_flow, end_flow } = rangeData[0]

      // 2. Generate random 3-digit sequence (one per batch)
      const randomSeq = generateRandomSequence()

      // 3. Assemble serial numbers
      const precursor = selectedSkuData.precursor
      const serialNumbers = generateSerialNumbers(precursor, permaNo, randomSeq, start_flow, end_flow)

      // 4. Record in generation_history
      const { error: insertError } = await supabase
        .from('generation_history')
        .insert({
          sku: selectedSku,
          quantity_generated: qty,
          starting_sn: serialNumbers[0],
          ending_sn: serialNumbers[serialNumbers.length - 1],
          serial_numbers: serialNumbers.join(', ')
        })

      if (insertError) throw insertError

      // 5. Update sku_ledger with last used perma_no and random_sequence
      await supabase
        .from('sku_ledger')
        .update({
          last_perma_no: permaNo,
          last_random_sequence: randomSeq
        })
        .eq('sku', selectedSku)

      // 6. Notify parent
      onGenerated(serialNumbers)

      // Reset form
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
