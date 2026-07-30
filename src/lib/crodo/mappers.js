// Maps Supabase rows <-> the shape components expect (camelCase, ms-based durations).

export function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    note: row.note ?? '',
    columnId: row.column_id ?? 'today',
    labelId: row.label_id ?? null,
    group: row.group_name || 'Без группы',
    priority: row.priority ?? 'medium',
    // elapsed time is split into a committed base (from total_seconds) and,
    // when the task is running, a live delta computed against last_start_time —
    // this survives page reloads unlike an in-memory-only timer.
    baseMs: (row.total_seconds ?? 0) * 1000,
    startedAt: row.is_running && row.last_start_time ? Date.parse(row.last_start_time) : null,
    position: row.position ?? 0,
    isArchived: !!row.is_archived,
    createdAt: row.inserted_at ? Date.parse(row.inserted_at) : 0,
  }
}

export function rowToColumn(row) {
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    isDone: !!row.is_done,
    position: row.position ?? 0,
  }
}

export function rowToLabel(row) {
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    color: row.color,
    position: row.position ?? 0,
  }
}
