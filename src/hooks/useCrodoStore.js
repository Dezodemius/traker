import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_COLUMNS, DEFAULT_LABELS } from '@/lib/crodo/types'
import { rowToTask, rowToColumn, rowToLabel } from '@/lib/crodo/mappers'

function sortColumns(rows) {
  return [...rows].sort((a, b) =>
    a.isDone === b.isDone ? a.position - b.position : a.isDone ? 1 : -1,
  )
}

/**
 * Supabase-backed replacement for the prototype's in-memory store. The
 * "chess clock" invariant (at most one running task) lives in the DB via
 * tasks.is_running / tasks.last_start_time, so the timer survives reloads
 * and is visible across devices — unlike the prototype's in-memory startRef.
 */
export function useCrodoStore(userId) {
  const [tasks, setTasks] = useState([])
  const [columns, setColumns] = useState([])
  const [labels, setLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const activeTask = useMemo(() => tasks.find((t) => t.startedAt != null) ?? null, [tasks])
  const activeId = activeTask?.id ?? null

  // ticking clock — only re-renders while a task is active
  useEffect(() => {
    if (!activeId) return
    const tick = () => setNowMs(Date.now())
    const interval = setInterval(tick, 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [activeId])

  const liveElapsed = useCallback(
    (task) => task.baseMs + (task.startedAt != null ? nowMs - task.startedAt : 0),
    [nowMs],
  )

  const ensureWorkspace = useCallback(async () => {
    const colsUpsert = await supabase.from('task_columns').upsert(
      DEFAULT_COLUMNS.map((c, i) => ({
        user_id: userId,
        slug: c.slug,
        name: c.name,
        is_done: c.isDone,
        position: i,
      })),
      { onConflict: 'user_id,slug', ignoreDuplicates: true },
    )
    if (colsUpsert.error) {
      console.error('[crodo] failed to seed workspace defaults', colsUpsert.error)
    }

    const labsUpsert = await supabase.from('task_labels').upsert(
      DEFAULT_LABELS.map((l, i) => ({
        user_id: userId,
        slug: l.slug,
        name: l.name,
        color: l.color,
        position: i,
      })),
      { onConflict: 'user_id,slug', ignoreDuplicates: true },
    )
    if (labsUpsert.error) {
      console.error('[crodo] failed to seed workspace defaults', labsUpsert.error)
    }

    return { colsError: colsUpsert.error, labsError: labsUpsert.error }
  }, [userId])

  const loadWorkspace = useCallback(async () => {
    if (!userId) return

    setLoadError(null)

    let [colsRes, labsRes] = await Promise.all([
      supabase.from('task_columns').select('*').eq('user_id', userId).order('position'),
      supabase.from('task_labels').select('*').eq('user_id', userId).order('position'),
    ])

    if (!colsRes.data?.length || !labsRes.data?.length) {
      await ensureWorkspace()
      ;[colsRes, labsRes] = await Promise.all([
        supabase.from('task_columns').select('*').eq('user_id', userId).order('position'),
        supabase.from('task_labels').select('*').eq('user_id', userId).order('position'),
      ])
    }

    const tasksRes = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    // If columns or labels are still empty after all attempts due to errors, use fallback + show error
    let finalColumns = (colsRes.data ?? []).map(rowToColumn)
    let finalLabels = (labsRes.data ?? []).map(rowToLabel)

    if (finalColumns.length === 0 || finalLabels.length === 0) {
      if (colsRes.error || labsRes.error) {
        console.error('[crodo] Failed to load columns/labels', {
          colsError: colsRes.error,
          labsError: labsRes.error,
        })
        setLoadError(
          'Не удалось загрузить колонки и метки. Похоже, миграция supabase/migrations/0001_crodo_design.sql ещё не применена в Supabase — см. docs/SUPABASE_MIGRATION.md.',
        )
        // Fallback to defaults shaped like rowToColumn/rowToLabel
        finalColumns = DEFAULT_COLUMNS.map((c, i) => ({
          id: c.slug,
          dbId: undefined,
          name: c.name,
          isDone: c.isDone,
          position: i,
        }))
        finalLabels = DEFAULT_LABELS.map((l, i) => ({
          id: l.slug,
          dbId: undefined,
          name: l.name,
          color: l.color,
          position: i,
        }))
      }
    }

    setColumns(sortColumns(finalColumns))
    setLabels(finalLabels)
    setTasks((tasksRes.data ?? []).map(rowToTask))
    setLoading(false)
  }, [userId, ensureWorkspace])

  useEffect(() => {
    if (!userId) {
      setTasks([])
      setColumns([])
      setLabels([])
      setLoading(false)
      return
    }
    setLoading(true)
    loadWorkspace()
  }, [userId, loadWorkspace])

  const commitTask = useCallback(
    async (task, isRunning) => {
      const elapsedSeconds = Math.floor(liveElapsed(task) / 1000)
      await supabase
        .from('tasks')
        .update({
          is_running: isRunning,
          total_seconds: elapsedSeconds,
          last_start_time: isRunning ? new Date().toISOString() : null,
        })
        .eq('id', task.id)
        .eq('user_id', userId)
    },
    [liveElapsed, userId],
  )

  /** chess-clock switch: start this task, pause whichever was running */
  const startTask = useCallback(
    async (id) => {
      const now = Date.now()
      const prev = tasks.find((t) => t.startedAt != null)
      const target = tasks.find((t) => t.id === id)
      if (!target || target.id === prev?.id) return

      setTasks((list) =>
        list.map((t) => {
          if (t.id === id) return { ...t, startedAt: now }
          if (prev && t.id === prev.id) return { ...t, baseMs: liveElapsed(t), startedAt: null }
          return t
        }),
      )

      try {
        if (prev) await commitTask(prev, false)
        const { error } = await supabase
          .from('tasks')
          .update({ is_running: true, last_start_time: new Date(now).toISOString() })
          .eq('id', id)
          .eq('user_id', userId)
        if (error) throw error
      } catch {
        await loadWorkspace()
      }
    },
    [tasks, liveElapsed, commitTask, userId, loadWorkspace],
  )

  const pauseActive = useCallback(async () => {
    const active = tasks.find((t) => t.startedAt != null)
    if (!active) return
    const committedMs = liveElapsed(active)
    setTasks((list) =>
      list.map((t) => (t.id === active.id ? { ...t, baseMs: committedMs, startedAt: null } : t)),
    )
    try {
      await commitTask(active, false)
    } catch {
      await loadWorkspace()
    }
  }, [tasks, liveElapsed, commitTask, loadWorkspace])

  const toggleTask = useCallback(
    (id) => (activeId === id ? pauseActive() : startTask(id)),
    [activeId, pauseActive, startTask],
  )

  const moveTask = useCallback(
    async (id, columnId, position) => {
      const task = tasks.find((t) => t.id === id)
      const target = columns.find((c) => c.id === columnId)
      if (!task || !target) return

      if (target.isDone && task.startedAt != null) {
        await pauseActive()
      }

      setTasks((list) =>
        list.map((t) =>
          t.id === id
            ? { ...t, columnId, isArchived: target.isDone, position: position ?? t.position }
            : t,
        ),
      )

      const patch = { column_id: columnId, is_archived: target.isDone }
      if (position != null) patch.position = position

      const { error } = await supabase.from('tasks').update(patch).eq('id', id).eq('user_id', userId)
      if (error) await loadWorkspace()
    },
    [tasks, columns, pauseActive, userId, loadWorkspace],
  )

  const deleteTask = useCallback(
    async (id) => {
      if (activeId === id) {
        await pauseActive()
      }

      setTasks((list) => list.filter((t) => t.id !== id))

      const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId)
      if (error) {
        console.error('Failed to delete task:', error)
        await loadWorkspace()
      }
    },
    [activeId, pauseActive, userId, loadWorkspace],
  )

  const addTask = useCallback(
    async ({ title, columnId, labelId, priority, group, note }) => {
      const maxPos = tasks.length ? Math.max(...tasks.map((t) => t.position)) : 0
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            user_id: userId,
            column_id: columnId ?? 'today',
            label_id: labelId ?? null,
            group_name: group ?? '',
            priority: priority ?? 'medium',
            note: note ?? null,
            position: maxPos + 1000,
          },
        ])
        .select()
        .single()

      if (error || !data) {
        await loadWorkspace()
        return null
      }

      const task = rowToTask(data)
      setTasks((list) => [task, ...list])
      return task.id
    },
    [tasks, userId, loadWorkspace],
  )

  const addColumn = useCallback(
    async (name) => {
      const slug = `col-${Date.now()}`
      const doneIndex = columns.findIndex((c) => c.isDone)
      const position = doneIndex === -1 ? columns.length : doneIndex

      const { data, error } = await supabase
        .from('task_columns')
        .insert([{ user_id: userId, slug, name, is_done: false, position }])
        .select()
        .single()

      if (error || !data) {
        await loadWorkspace()
        return null
      }

      const column = rowToColumn(data)
      setColumns((list) => sortColumns([...list, column]))
      return column.id
    },
    [columns, userId, loadWorkspace],
  )

  const totalTrackedMs = useMemo(
    () => tasks.reduce((sum, t) => sum + liveElapsed(t), 0),
    [tasks, liveElapsed],
  )

  return {
    tasks,
    columns,
    labels,
    loading,
    loadError,
    activeId,
    activeTask,
    totalTrackedMs,
    liveElapsed,
    toggleTask,
    startTask,
    pauseActive,
    moveTask,
    deleteTask,
    addTask,
    addColumn,
    refetch: loadWorkspace,
  }
}
