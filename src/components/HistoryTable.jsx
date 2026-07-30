import { Download, Inbox } from 'lucide-react'
import { downloadCSV } from '../lib/csvExport'

export default function HistoryTable({ history }) {
  const handleDownload = (batch) => {
    const sns = batch.serial_numbers.split(', ')
    const filename = `${batch.sku}_${new Date(batch.created_at).toISOString().slice(0, 10)}`
    downloadCSV(sns, filename)
  }

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Generation History</h2>
        <p className="section-subtitle">All previously generated serial number batches</p>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          <p>No serial numbers generated yet. Use the form above to get started.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Range</th>
                <th>Qty</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Export</th>
              </tr>
            </thead>
            <tbody>
              {history.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <span className="badge blue">{batch.sku}</span>
                  </td>
                  <td style={{ fontFamily: "'Courier New', monospace", fontSize: '12px' }}>
                    {batch.starting_sn} → {batch.ending_sn}
                  </td>
                  <td>
                    <span className="badge green">{batch.quantity_generated}</span>
                  </td>
                  <td>
                    {new Date(batch.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownload(batch)}
                    >
                      <Download size={14} />
                      CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
