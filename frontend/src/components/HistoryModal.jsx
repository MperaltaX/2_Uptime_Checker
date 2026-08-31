import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function HistoryModal({ site, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/websites/${site.id}/history`)
        const data = await res.json()
        setHistory(data)
      } catch (error) {
        console.error("Failed to fetch history", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [site.id])

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="glass-panel modal-content history-modal-content"
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Historial</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{site.name}</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="timeline-container" style={{ overflowY: 'auto', flex: 1, paddingRight: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando historial...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay datos de historial todavía.</div>
          ) : (
            <div className="timeline">
              {history.map((record, index) => {
                const isUp = record.status === 'UP';
                const date = new Date(record.checked_at);
                return (
                  <motion.div 
                    key={index} 
                    className="timeline-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="timeline-icon" style={{ backgroundColor: isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isUp ? 'var(--status-up)' : 'var(--status-down)' }}>
                      {isUp ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-time">
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </div>
                      <div className={`timeline-status ${isUp ? 'text-up' : 'text-down'}`}>
                        {record.status}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
