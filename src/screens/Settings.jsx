export default function Settings({ settings, onUpdate, active }) {
  const { intervalMins, notifications } = settings

  const requestNotifications = async () => {
    const result = await Notification.requestPermission()
    onUpdate({ notifications: result })
  }

  const notifLabel = {
    granted: 'enabled',
    denied: 'blocked by browser',
    default: 'not enabled',
  }[notifications]

  return (
    <div className={`screen${active ? ' active' : ''}`} id="screen-settings">

      <div className="settings-section">
        <div className="slabel">timer</div>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">break every</div>
            <div className="setting-desc">how long between break nudges</div>
          </div>
          <select
            value={intervalMins}
            onChange={e => onUpdate({ intervalMins: parseFloat(e.target.value) })}
          >
<option value="25">25 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="75">75 min</option>
            <option value="90">90 min</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <div className="slabel">notifications</div>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">desktop notifications</div>
            <div className="setting-desc">get notified when it's break time</div>
          </div>
          {notifications === 'granted' && (
            <div className="setting-status enabled">on</div>
          )}
          {notifications === 'denied' && (
            <div className="setting-status denied">blocked</div>
          )}
          {notifications === 'default' && (
            <button className="setting-btn" onClick={requestNotifications}>enable</button>
          )}
        </div>
        {notifications === 'denied' && (
          <div className="setting-hint">notifications are blocked — update this in your browser's site settings</div>
        )}
      </div>

    </div>
  )
}
