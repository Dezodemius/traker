import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCompact } from '@/lib/crodo/types'
import { TaskCard } from './TaskCard'

export function KanbanView({ store }) {
  const { tasks, columns, labels, activeId, liveElapsed, toggleTask, moveTask, addColumn } = store

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed) addColumn(trimmed)
    setName('')
    setAdding(false)
  }

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const destColumnTasks = tasks
      .filter((t) => t.columnId === destination.droppableId && t.id !== draggableId)
      .sort((a, b) => a.position - b.position)

    const before = destColumnTasks[destination.index - 1]
    const after = destColumnTasks[destination.index]

    let position
    if (!before && !after) position = 0
    else if (!before) position = after.position - 1000
    else if (!after) position = before.position + 1000
    else position = (before.position + after.position) / 2

    moveTask(draggableId, destination.droppableId, position)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {columns.map((column) => {
          const columnTasks = tasks
            .filter((t) => t.columnId === column.id)
            .sort((a, b) => a.position - b.position)
          const total = columnTasks.reduce((s, t) => s + liveElapsed(t), 0)
          return (
            <section
              key={column.id}
              className="flex w-[82vw] max-w-[20rem] shrink-0 snap-start flex-col gap-3 sm:w-72"
            >
              <header className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn('size-2 rounded-full', column.isDone ? 'bg-running' : 'bg-primary')}
                  />
                  <h2 className="text-sm font-semibold text-card-foreground">{column.name}</h2>
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {formatCompact(total)}
                </span>
              </header>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex min-h-[3rem] flex-col gap-3"
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={cn(snapshot.isDragging && 'rotate-1 opacity-90 shadow-xl')}
                          >
                            <TaskCard
                              task={task}
                              label={labels.find((l) => l.id === task.labelId) ?? null}
                              columns={columns}
                              running={activeId === task.id}
                              elapsedMs={liveElapsed(task)}
                              onToggle={() => toggleTask(task.id)}
                              onMove={(columnId) => moveTask(task.id, columnId)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {columnTasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                        Пусто
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </section>
          )
        })}

        {/* add-column affordance */}
        <div className="w-[82vw] max-w-[20rem] shrink-0 snap-start sm:w-72">
          {adding ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-card p-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  if (e.key === 'Enter') submit()
                  if (e.key === 'Escape') setAdding(false)
                }}
                placeholder="Название столбца"
                className="min-w-0 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={submit}
                aria-label="Добавить столбец"
                className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                aria-label="Отмена"
                className="grid size-7 place-items-center rounded-md bg-secondary text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="size-4" />
              Добавить столбец
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  )
}
