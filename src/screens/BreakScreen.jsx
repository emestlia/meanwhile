import { useState, useEffect, useCallback, useRef } from 'react'

const CIRCUMFERENCE = 2 * Math.PI * 45

function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function randomTask(tasks) {
  if (!tasks.length) return 'take a moment to rest'
  return tasks[Math.floor(Math.random() * tasks.length)].name
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

export default function BreakScreen({ tasks, onVictory, active, settings }) {
  const totalSecs = Math.round(settings.intervalMins * 60)
  const [remaining, setRemaining] = useState(totalSecs)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('idle')
  const [deferred, setDeferred] = useState(false)
  const [currentTask, setCurrentTask] = useState(() => randomTask(tasks))
  const [taskFading, setTaskFading] = useState(false)
  const flashRef = useRef(null)
  const endTimeRef = useRef(null)

  // Reset timer when interval setting changes
  useEffect(() => {
    setRemaining(settings.intervalMins * 60)
    setRunning(false)
  }, [settings.intervalMins])

  const fireNudge = useCallback(() => {
    const task = randomTask(tasks)
    setCurrentTask(task)
    setRunning(false)
    setMode('nudge')
    setDeferred(false)
    fireNotification(task)
    flashRef.current = startTitleFlash()
  }, [tasks])

  useEffect(() => {
    if (!running) return
    // Record the wall-clock end time so throttled tabs stay accurate
    endTimeRef.current = Date.now() + remaining * 1000
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

  const toggleTimer = () => setRunning(r => !r)

  const resetTimer = () => {
    setRunning(false)
    setRemaining(totalSecs)
  }

  const skipTask = () => {
    setTaskFading(true)
    setTimeout(() => {
      setCurrentTask(randomTask(tasks))
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
              <div className="idle-time">{fmt(remaining)}</div>
              <div className="idle-sub">
                {running ? 'next break' : remaining < totalSecs ? 'paused' : 'next break'}
              </div>
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
