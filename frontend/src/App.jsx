import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import AddWebsiteModal from './components/AddWebsiteModal'
import { Activity, Plus, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTriggering, setIsTriggering] = useState(false)

  const fetchWebsites = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/websites`)
      const data = await res.json()
      setWebsites(data)
    } catch (error) {
      console.error("Failed to fetch websites", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async () => {
    setIsTriggering(true)
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/websites/trigger`, {
        method: 'POST'
      })
      await fetchWebsites()
    } catch (error) {
      console.error("Failed to trigger check", error)
      alert("Error al intentar verificar los sitios manualmente.")
    } finally {
      setIsTriggering(false)
    }
  }

  useEffect(() => {
    fetchWebsites()
    const interval = setInterval(fetchWebsites, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container">
      <header className="header">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Activity className="animate-pulse" size={40} color="#8b5cf6" />
          Uptime Checker
        </motion.h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <motion.button 
            className="btn-secondary"
            onClick={handleTrigger}
            disabled={isTriggering}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid var(--glass-border)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            <RefreshCw size={20} className={isTriggering ? 'animate-spin' : ''} />
            {isTriggering ? 'Verificando...' : 'Verificar Ahora'}
          </motion.button>
          
          <motion.button 
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            Añadir Sitio
          </motion.button>
        </div>
      </header>

      <main>
        {loading ? (
          <div className="loader">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Activity size={48} color="#8b5cf6" />
            </motion.div>
          </div>
        ) : (
          <Dashboard websites={websites} refresh={fetchWebsites} />
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <AddWebsiteModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
              setIsModalOpen(false)
              fetchWebsites()
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
