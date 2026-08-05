import { useState } from 'react'
import { dataManager } from '../lib/dataManager'
import { Pencil, Check, X, AlertTriangle } from 'lucide-react'

export default function SkuTable({ skus, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editField, setEditField] = useState('')
  const [editValue, setEditValue] = useState('')
  const [confirmReset, setConfirmReset] = useState(null)
  const [saving, setSaving] = useState(false)

  const startEdit = (sku, field, currentValue) => {
    setEditingId(sku)
    setEditField(field)
    setEditValue(String(currentValue))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditField('')
    setEditValue('')
  }

  const saveEdit = async (sku) => {
    if (editField === 'current_flow_number') {
      // Show confirmation for flow number changes
      setConfirmReset({ sku, value: parseInt(editValue) || 0 })
      return
    }

    setSaving(true)
    try {
      await dataManager.updateSKU(sku, { [editField]: editValue })
      cancelEdit()
      onUpdate()
    } catch (err) {
      console.error('Update failed:', err)
      alert('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmFlowChange = async () => {
    if (!confirmReset) return

    setSaving(true)
    try {
      await dataManager.updateSKU(confirmReset.sku, { current_flow_number: confirmReset.value })
      setConfirmReset(null)
      cancelEdit()
      onUpdate()
    } catch (err) {
      console.error('Update failed:', err)
      alert('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const renderCell = (skuData, field, value) => {
    if (editingId === skuData.sku && editField === field) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type={field === 'current_flow_number' ? 'number' : 'text'}
            className="inline-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit(skuData.sku)
              if (e.key === 'Escape') cancelEdit()
            }}
            autoFocus
          />
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => saveEdit(skuData.sku)}
            disabled={saving}
            style={{ width: '28px', height: '28px' }}
          >
            <Check size={14} />
          </button>
          <button
            className="btn btn-icon btn-secondary"
            onClick={cancelEdit}
            style={{ width: '28px', height: '28px' }}
          >
            <X size={14} />
          </button>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => startEdit(skuData.sku, field, value)}>
        <span>{value}</span>
        <Pencil size={12} style={{ opacity: 0.4 }} />
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Precursor</th>
                <th>Flow Number</th>
                <th>Last Perma No</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {skus.map((s) => (
                <tr key={s.sku}>
                  <td>
                    <span className="badge blue">{s.sku}</span>
                  </td>
                  <td>{renderCell(s, 'precursor', s.precursor)}</td>
                  <td>{renderCell(s, 'current_flow_number', s.current_flow_number)}</td>
                  <td style={{ fontFamily: "'Courier New', monospace", fontSize: '13px' }}>
                    {s.last_perma_no || '—'}
                  </td>
                  <td>
                    {new Date(s.updated_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Flow Number Changes */}
      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-amber)'
              }}>
                <AlertTriangle size={20} />
              </div>
              <h3 className="modal-title" style={{ marginBottom: 0 }}>Confirm Flow Number Change</h3>
            </div>
            <p className="confirm-text">
              You are about to change the flow number for <strong>{confirmReset.sku}</strong> to <strong>{confirmReset.value}</strong>.
              This could result in duplicate serial numbers if set lower than a previously used value. Are you sure?
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmReset(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmFlowChange} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
