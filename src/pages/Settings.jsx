import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import SkuTable from '../components/SkuTable'

export default function Settings() {
  const [skus, setSkus] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSkus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sku_ledger')
        .select('*')
        .order('sku')

      if (error) throw error
      if (data) setSkus(data)
    } catch (err) {
      console.error('Failed to fetch SKUs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkus()
  }, [fetchSkus])

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
        <p className="page-subtitle">Manage SKU precursors and flow numbers. Click any editable field to modify it.</p>
      </div>

      <SkuTable skus={skus} onUpdate={fetchSkus} />
    </div>
  )
}
