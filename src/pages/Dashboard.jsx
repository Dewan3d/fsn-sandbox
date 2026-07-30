import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import StatsCards from '../components/StatsCards'
import GenerationForm from '../components/GenerationForm'
import HistoryTable from '../components/HistoryTable'
import { Download, X } from 'lucide-react'
import { downloadCSV } from '../lib/csvExport'

export default function Dashboard() {
  const [skus, setSkus] = useState([])
  const [history, setHistory] = useState([])
  const [totalSNs, setTotalSNs] = useState(0)
  const [latestBatch, setLatestBatch] = useState(null)
  const [generatedSNs, setGeneratedSNs] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      // Fetch SKUs
      const { data: skuData } = await supabase
        .from('sku_ledger')
        .select('*')
        .order('sku')

      // Fetch history
      const { data: historyData } = await supabase
        .from('generation_history')
        .select('*')
        .order('created_at', { ascending: false })

      if (skuData) setSkus(skuData)
      if (historyData) {
        setHistory(historyData)

        // Calculate total SNs
        const total = historyData.reduce((sum, h) => sum + h.quantity_generated, 0)
        setTotalSNs(total)

        // Latest batch
        if (historyData.length > 0) {
          setLatestBatch(historyData[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerated = (serialNumbers) => {
    setGeneratedSNs(serialNumbers)
    fetchData()
  }

  const handleDownloadGenerated = () => {
    if (generatedSNs) {
      downloadCSV(generatedSNs, `batch_${new Date().toISOString().slice(0, 10)}`)
    }
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
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Generate and manage serial numbers for your accessories</p>
      </div>

      <StatsCards
        totalSNs={totalSNs}
        activeSKUs={skus.length}
        latestBatch={latestBatch}
      />

      <GenerationForm skus={skus} onGenerated={handleGenerated} />

      <HistoryTable history={history} />

      {/* Success Modal — shows generated SNs */}
      {generatedSNs && (
        <div className="modal-overlay" onClick={() => setGeneratedSNs(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ marginBottom: 0 }}>
                ✅ {generatedSNs.length} Serial Numbers Generated
              </h3>
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => setGeneratedSNs(null)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-sns">
              {generatedSNs.map((sn, i) => (
                <div key={i}>{sn}</div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setGeneratedSNs(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleDownloadGenerated}>
                <Download size={16} />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
