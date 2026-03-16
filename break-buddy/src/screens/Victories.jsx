export default function Victories({ log, active }) {
  const today = new Date().toDateString()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const todayCount = log.filter(e => new Date(e.ts).toDateString() === today).length
  const weekCount = log.filter(e => new Date(e.ts) >= weekAgo).length
  const allCount = log.length

  const streakText = allCount === 0
    ? 'start your streak today'
    : allCount === 1
    ? 'first victory today!'
    : `${allCount} task${allCount > 1 ? 's' : ''} done — keep going`

  return (
    <div className={`screen${active ? ' active' : ''}`} id="screen-victories">
      <div className="v-stats">
        <div className="v-card">
          <div className="v-num">{todayCount}</div>
          <div className="v-lbl">today</div>
        </div>
        <div className="v-card">
          <div className="v-num">{weekCount}</div>
          <div className="v-lbl">this week</div>
        </div>
        <div className="v-card">
          <div className="v-num">{allCount}</div>
          <div className="v-lbl">all time</div>
        </div>
      </div>
      <div className="streak">
        <span>{streakText}</span>
      </div>
      <div className="slabel">recent completions</div>
      <div>
        {log.length === 0 ? (
          <div className="empty-log">no completions yet</div>
        ) : (
          [...log].reverse().map((entry, i) => {
            const d = new Date(entry.ts)
            const timeStr = d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })
            const isToday = d.toDateString() === today
            return (
              <div className="log-item" key={i}>
                <span className="log-task">{entry.task}</span>
                <span className="log-time">{isToday ? `today, ${timeStr}` : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
