import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Save } from 'lucide-react'

export default function AddWebsiteModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Auto-prepend https:// if missing
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url: finalUrl })
      })

      if (res.ok) {
        onSuccess()
      } else {
        alert('Error al añadir el sitio web.')
      }
    } catch (error) {
      console.error(error)
      alert('Error de red.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="glass-panel modal-content"
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Añadir Nuevo Sitio</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Sitio</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej. Mi Blog Personal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>URL</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej. https://mi-blog.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Save size={18} />
              {isSubmitting ? 'Guardando...' : 'Guardar Sitio'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
