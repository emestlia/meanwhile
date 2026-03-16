import { useState } from 'react'
import './App.css'
import { useLocalStorage } from './hooks/useLocalStorage'
import BreakScreen from './screens/BreakScreen'
import TaskPool from './screens/TaskPool'
import Victories from './screens/Victories'
import Settings from './screens/Settings'

const DEFAULT_TASKS = [
  { name: 'clean the cat litter', freq: 1 },
  { name: 'fill water bottle', freq: 4 },
  { name: 'quick desk tidy', freq: 2 },
  { name: 'reply to that one email', freq: 2 },
  { name: '5 min walk outside', freq: 3 },
]

const DEFAULT_SETTINGS = {
  intervalMins: 75,
  notifications: Notification.permission,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('break')
  const [showSettings, setShowSettings] = useState(false)
  const [tasks, setTasks] = useLocalStorage('bb-tasks', DEFAULT_TASKS)
  const [log, setLog] = useLocalStorage('bb-log', [])
  const [settings, setSettings] = useLocalStorage('bb-settings', DEFAULT_SETTINGS)

  const updateSettings = (patch) => setSettings(s => ({ ...s, ...patch }))

  const handleVictory = (task) => {
    setLog(l => [...l, { task, ts: Date.now() }])
  }

  return (
    <div className="app">
      <div className="hdr">
        <span className="hdr-title">meanwhile</span>
        <button className={`hdr-settings-btn${showSettings ? ' active' : ''}`} onClick={() => setShowSettings(s => !s)}>⚙</button>
      </div>
      <div className="nav" style={{ display: showSettings ? 'none' : 'flex' }}>
        <button className={activeTab === 'break' ? 'active' : ''} onClick={() => setActiveTab('break')}>break</button>
        <button className={activeTab === 'pool' ? 'active' : ''} onClick={() => setActiveTab('pool')}>tasks</button>
        <button className={activeTab === 'victories' ? 'active' : ''} onClick={() => setActiveTab('victories')}>victories</button>
      </div>

      {!showSettings && (
        <>
          <BreakScreen tasks={tasks} log={log} onVictory={handleVictory} active={activeTab === 'break'} settings={settings} />
          <TaskPool tasks={tasks} setTasks={setTasks} active={activeTab === 'pool'} />
          <Victories log={log} active={activeTab === 'victories'} />
        </>
      )}
      {showSettings && (
        <Settings settings={settings} onUpdate={updateSettings} active />
      )}
    </div>
  )
}
