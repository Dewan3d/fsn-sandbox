import { Hash, Layers, Clock } from 'lucide-react'

export default function StatsCards({ totalSNs, activeSKUs, latestBatch }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
      {/* Total SNs */}
      <div className="card stat-card">
        <div className="stat-icon blue">
          <Hash size={22} />
        </div>
        <div>
          <div className="stat-value">{totalSNs.toLocaleString()}</div>
          <div className="stat-label">Total SNs Generated</div>
        </div>
      </div>

      {/* Active SKUs */}
      <div className="card stat-card">
        <div className="stat-icon green">
          <Layers size={22} />
        </div>
        <div>
          <div className="stat-value">{activeSKUs}</div>
          <div className="stat-label">Active SKUs</div>
        </div>
      </div>

      {/* Latest Batch */}
      <div className="card stat-card">
        <div className="stat-icon purple">
          <Clock size={22} />
        </div>
        <div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            {latestBatch ? latestBatch.sku : '—'}
          </div>
          <div className="stat-label">
            {latestBatch
              ? `${latestBatch.quantity_generated} SNs • ${new Date(latestBatch.created_at).toLocaleDateString()}`
              : 'No batches yet'}
          </div>
        </div>
      </div>
    </div>
  )
}
