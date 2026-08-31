import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Globe, CheckCircle, XCircle, Clock } from 'lucide-react'
import HistoryModal from './HistoryModal'

export default function Dashboard({ websites, refresh }) {
  const [selectedSite, setSelectedSite] = useState(null)
  
  const handleDelete = async (id, e) => {
    e.stopPropagation() // Prevent opening modal
    if (!confirm('¿Seguro que deseas eliminar este sitio?')) return;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/websites/${id}`, {
        method: 'DELETE'
      });
      refresh();
    } catch (error) {
      console.error("Error deleting website", error);
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UP': return <CheckCircle size={16} />;
      case 'DOWN': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  }

  if (websites.length === 0) {
    return (
      <motion.div 
        className="glass-panel" 
        style={{ padding: '3rem', textAlign: 'center' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>No hay sitios web configurados</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          Añade tu primer sitio web para empezar a monitorearlo.
        </p>
      </motion.div>
    )
  }

  return (
    <>
      <div className="grid-cards">
        {websites.map((site, index) => (
          <motion.div 
            key={site.id}
            className="glass-panel card clickable-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => setSelectedSite(site)}
          >
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`} 
                  alt={`${site.name} icon`}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div>
                  <h3 className="card-title">{site.name}</h3>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="card-url" onClick={(e) => e.stopPropagation()}>
                    <Globe size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    {site.url}
                  </a>
                </div>
              </div>
              <button 
                className="btn-icon" 
                onClick={(e) => handleDelete(site.id, e)}
                title="Eliminar"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`status-badge status-${site.status}`}>
                {getStatusIcon(site.status)}
                {site.status}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {site.last_checked ? new Date(site.last_checked).toLocaleString() : 'Pendiente...'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <AnimatePresence>
        {selectedSite && (
          <HistoryModal site={selectedSite} onClose={() => setSelectedSite(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
