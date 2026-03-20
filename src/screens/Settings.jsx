export default function Settings({ settings, onUpdate, active }) {
  const { notifications } = settings

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
