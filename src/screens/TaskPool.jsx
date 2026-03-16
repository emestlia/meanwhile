import { useState, useRef, useEffect, useCallback } from 'react'

const FREQ_OPTIONS = [
  { value: 1, label: 'once' },
  { value: 2, label: 'twice' },
  { value: 3, label: '3×' },
  { value: 4, label: '4×' },
  { value: 5, label: '5×' },
  { value: 6, label: '6×' },
  { value: 7, label: '7×' },
  { value: 8, label: '8×' },
]

function freqBadge(freq) {
  if (freq === 1) return 'once'
  if (freq === 2) return 'twice'
  return `${freq}×`
}

function EditableTask({ task, onSave, onDelete }) {
  const [name, setName] = useState(task.name)
  const [freq, setFreq] = useState(task.freq ?? 3)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  const rowRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) return
    const handleClickOutside = (e) => {
      if (rowRef.current && !rowRef.current.contains(e.target)) save()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editing, name, freq])

  const save = () => {
    if (name.trim()) onSave({ name: name.trim(), freq })
    setEditing(false)
  }

  const cancel = () => {
    setName(task.name)
    setFreq(task.freq ?? 3)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="pool-item pool-item-editing" ref={rowRef}>
        <input
          ref={inputRef}
          className="pool-edit-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        />
        <select
          className="pool-edit-select"
          value={freq}
          onChange={e => setFreq(parseInt(e.target.value))}
        >
          {FREQ_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="pool-item">
      <span className="pool-name">{task.name}</span>
      <span className="pool-badge">{freqBadge(task.freq ?? 3)}</span>
      <button className="pool-edit" onClick={() => setEditing(true)}>✎</button>
      <button className="pool-del" onClick={onDelete}>×</button>
    </div>
  )
}

export default function TaskPool({ tasks, setTasks, active }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFreq, setNewFreq] = useState(3)
  const inputRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const cancel = useCallback(() => {
    setNewName('')
    setNewFreq(3)
    setAdding(false)
  }, [])

  const addTask = useCallback(() => {
    if (newName.trim()) {
      setTasks(t => [...t, { name: newName.trim(), freq: newFreq }])
    }
    setNewName('')
    setNewFreq(3)
    setAdding(false)
  }, [newName, newFreq, setTasks])

  useEffect(() => {
    if (!adding) return
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) addTask()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [adding, addTask])

  const updateTask = (i, updated) => {
    setTasks(t => t.map((task, idx) => idx === i ? updated : task))
  }

  const removeTask = (i) => {
    setTasks(t => t.filter((_, idx) => idx !== i))
  }

  return (
    <div className={`screen${active ? ' active' : ''}`} id="screen-pool">
      <div className="slabel">your tasks</div>
      <div>
        {tasks.map((t, i) => (
          <EditableTask
            key={i}
            task={t}
            onSave={updated => updateTask(i, updated)}
            onDelete={() => removeTask(i)}
          />
        ))}
      </div>

      {!adding ? (
        <button className="btn-add-task" onClick={() => setAdding(true)}>+ add a task</button>
      ) : (
        <div className="add-form" ref={formRef}>
          <div className="add-row">
            <input
              ref={inputRef}
              type="text"
              placeholder="what's the task?"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') cancel() }}
            />
            <select value={newFreq} onChange={e => setNewFreq(parseInt(e.target.value))}>
              {FREQ_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
