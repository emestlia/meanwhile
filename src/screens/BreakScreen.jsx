import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const CIRCUMFERENCE = 2 * Math.PI * 45

function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function randomTask(tasks, log) {
  if (!tasks.length) return 'take a moment to rest'
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const todayCounts = {}
  for (const entry of log) {
    if (entry.ts >= todayStart) todayCounts[entry.task] = (todayCounts[entry.task] || 0) + 1
  }
  const available = tasks.filter(t => (todayCounts[t.name] || 0) < t.freq)
  if (!available.length) return null
  return available[Math.floor(Math.random() * available.length)].name
}

function fireNotification(task) {
  if (Notification.permission === 'granted') {
    const n = new Notification('meanwhile — break time', {
      body: `while you're up: ${task}`,
      tag: 'meanwhile',
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  }
}

function startTitleFlash() {
  let on = true
  const id = setInterval(() => {
    document.title = on ? '⏰ break time!' : 'meanwhile'
    on = !on
  }, 1000)
  return id
}

function stopTitleFlash(id) {
  clearInterval(id)
  document.title = 'meanwhile'
}

const STORAGE_KEY = 'bb-end-time'

function loadSavedTimer() {
  const savedEndTime = Number(localStorage.getItem(STORAGE_KEY) || 0)
  const secsLeft = Math.round((savedEndTime - Date.now()) / 1000)
  return { savedEndTime, secsLeft }
}

export default function BreakScreen({ tasks, log, onVictory, active }) {
  const [intervalMins, setIntervalMins] = useLocalStorage('bb-interval-mins', 75)
  const totalSecs = Math.round(intervalMins * 60)

  const [remaining, setRemaining] = useState(() => {
    const { secsLeft } = loadSavedTimer()
    return secsLeft > 0 ? secsLeft : Math.round(intervalMins * 60)
  })
  const [running, setRunning] = useState(() => loadSavedTimer().secsLeft > 0)
  const [mode, setMode] = useState(() => {
    const { savedEndTime, secsLeft } = loadSavedTimer()
    return savedEndTime > 0 && secsLeft <= 0 ? 'nudge' : 'idle'
  })
  const [deferred, setDeferred] = useState(false)
  const [currentTask, setCurrentTask] = useState(() => randomTask(tasks, log))
  const [taskFading, setTaskFading] = useState(false)
  const [editingDuration, setEditingDuration] = useState(false)
  const [draftMins, setDraftMins] = useState('')
  const flashRef = useRef(null)
  const endTimeRef = useRef(null)
  const durationInputRef = useRef(null)

  // Fire nudge immediately if the timer expired while the page was closed
  useEffect(() => {
    const { savedEndTime, secsLeft } = loadSavedTimer()
    if (savedEndTime > 0 && secsLeft <= 0) {
      localStorage.removeItem(STORAGE_KEY)
      fireNotification(currentTask)
      flashRef.current = startTitleFlash()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fireNudge = useCallback(() => {
    const task = randomTask(tasks, log)
    setCurrentTask(task)
    setRunning(false)
    setMode('nudge')
    setDeferred(false)
    localStorage.removeItem(STORAGE_KEY)
    if (task) fireNotification(task)
    flashRef.current = startTitleFlash()
  }, [tasks, log])

  useEffect(() => {
    if (!running) return
    // Record the wall-clock end time so throttled tabs stay accurate
    endTimeRef.current = Date.now() + remaining * 1000
    localStorage.setItem(STORAGE_KEY, endTimeRef.current)
    const id = setInterval(() => {
      const secsLeft = Math.round((endTimeRef.current - Date.now()) / 1000)
      if (secsLeft <= 0) {
        clearInterval(id)
        setRemaining(0)
        fireNudge()
      } else {
        setRemaining(secsLeft)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running, fireNudge]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTimer = () => {
    if (running) localStorage.removeItem(STORAGE_KEY)
    setRunning(r => !r)
  }

  const resetTimer = () => {
    setRunning(false)
    setRemaining(totalSecs)
    localStorage.removeItem(STORAGE_KEY)
  }

  const startEditDuration = () => {
    setDraftMins(String(intervalMins))
    setEditingDuration(true)
    setTimeout(() => {
      durationInputRef.current?.select()
    }, 0)
  }

  const confirmDuration = () => {
    const parsed = parseFloat(draftMins)
    if (!isNaN(parsed) && parsed >= 1) {
      const newMins = Math.round(parsed)
      setIntervalMins(newMins)
      setRemaining(Math.round(newMins * 60))
      localStorage.removeItem(STORAGE_KEY)
    }
    setEditingDuration(false)
  }

  const skipTask = () => {
    setTaskFading(true)
    setTimeout(() => {
      setCurrentTask(randomTask(tasks, log))
      setTaskFading(false)
    }, 200)
  }

  const markDone = () => {
    stopTitleFlash(flashRef.current)
    onVictory(currentTask)
    endNudge()
  }

  const endNudge = () => {
    stopTitleFlash(flashRef.current)
    setMode('idle')
    setDeferred(false)
    setRemaining(totalSecs)
    setRunning(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const frac = remaining / totalSecs
  const dashOffset = CIRCUMFERENCE * (1 - frac)
  const timerLabel = running ? 'pause' : remaining < totalSecs ? 'resume' : 'start'

  return (
    <div className={`screen${active ? ' active' : ''}`} id="screen-break">
      {mode === 'idle' && (
        <div className="idle-state">
          <div className={`ring-wrap${running ? ' ring-running' : remaining < totalSecs ? ' ring-paused' : ''}`}>
            <svg className="idle-ring" viewBox="0 0 110 110">
              <circle className="bg" cx="55" cy="55" r="45" />
              <circle
                className="fg"
                cx="55" cy="55" r="45"
                transform="rotate(-90 55 55)"
                style={{ strokeDashoffset: dashOffset }}
              />
            </svg>
            <div className="ring-inner">
              {editingDuration ? (
                <>
                  <input
                    ref={durationInputRef}
                    className="duration-input"
                    type="number"
                    value={draftMins}
                    onChange={e => setDraftMins(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmDuration()
                      if (e.key === 'Escape') setEditingDuration(false)
                    }}
                    onBlur={confirmDuration}
                    min="1"
                  />
                  <div className="idle-sub">minutes</div>
                </>
              ) : (
                <>
                  <div
                    className={`idle-time${!running ? ' editable' : ''}`}
                    onClick={!running ? startEditDuration : undefined}
                  >
                    {fmt(remaining)}
                  </div>
                  <div className="idle-sub">
                    {running ? 'next break' : remaining < totalSecs ? 'paused' : 'next break'}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="idle-btns">
            <button className="go" onClick={toggleTimer} title={timerLabel}>
              {running ? '⏹' : '▶'}
            </button>
            <button className="reset" onClick={resetTimer} title="reset">↺</button>
          </div>
          <button className="btn-random-task" onClick={fireNudge}>give me a random task</button>
        </div>
      )}

      {mode === 'nudge' && (
        <div>
          {deferred && (
            <div className="deferred-banner">
              <p>break deferred — meeting running long?</p>
              <button onClick={() => setDeferred(false)}>take the break now</button>
            </div>
          )}
          {!deferred && (
            <div className="nudge-wrap">
              <div className="nudge-eyebrow">time for a 5 min break</div>
              <div className="nudge-habits">
                <div className="habit"><div className="habit-label">stand and stretch</div></div>
                <div className="habit"><div className="habit-label">drink some water</div></div>
                <div className="habit"><div className="habit-label">rest your eyes</div></div>
              </div>
              <hr className="divider" />
              {currentTask === null ? (
                <>
                  <div className="nudge-task">no tasks left! rejoice 🎉</div>
                  <div className="nudge-btns">
                    <button className="btn-done" onClick={endNudge}>back to timer</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="nudge-prompt">while you're up</div>
                  <div className={`nudge-task${taskFading ? ' fading' : ''}`}>
                    {currentTask}
                  </div>
                  <div className="nudge-btns">
                    <button className="btn-done" onClick={markDone} title="done">✓</button>
                    <button className="btn-skip" onClick={skipTask} title="give me a different task">⤭</button>
                  </div>
                  <button className="btn-meeting" onClick={() => setDeferred(true)}>
                    i'm in a meeting right now
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
