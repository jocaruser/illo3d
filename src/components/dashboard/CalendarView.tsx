import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useShopMetadata } from '@/hooks/useShopMetadata'
import type { Piece, Job } from '@/types/money'
import { isActiveRow } from '@/lib/entityFilters'

interface CalendarPiece extends Piece {
  job: Job & { clientName?: string }
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month, 1)
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

function getCalendarGrid(year: number, month: number): Date[] {
  const days = getDaysInMonth(year, month)
  const firstDay = days[0]
  const lastDay = days[days.length - 1]
  
  const startDayOfWeek = firstDay.getDay()
  const prevMonthDays: Date[] = []
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    prevMonthDays.push(date)
  }
  
  const endDayOfWeek = lastDay.getDay()
  const nextMonthDays: Date[] = []
  for (let i = 1; i < 7 - endDayOfWeek; i++) {
    const date = new Date(year, month + 1, i)
    nextMonthDays.push(date)
  }
  
  return [...prevMonthDays, ...days, ...nextMonthDays]
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDayLabel(date: Date, t: (key: string) => string): string {
  const today = new Date()
  if (isSameDay(date, today)) return t('calendar.today')
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) return t('calendar.tomorrow')
  
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

interface CalendarCardProps {
  piece: CalendarPiece
  columnColor?: string
  showJobName?: boolean
}

function CalendarCard({ piece, columnColor, showJobName = true }: CalendarCardProps) {
  return (
    <div
      className="rounded border border-border bg-surface-elevated p-2 text-xs hover:shadow-sm transition-shadow cursor-pointer"
      style={{ borderLeftColor: columnColor, borderLeftWidth: columnColor ? '3px' : undefined }}
    >
      {showJobName && (
        <div className="font-medium text-text truncate mb-0.5">
          {piece.job.description || `Job ${piece.job_id}`}
        </div>
      )}
      <div className="text-text-muted truncate">
        {piece.name || `Piece ${piece.id}`}
      </div>
      {piece.units && piece.units > 1 && (
        <div className="mt-0.5 text-text-muted">×{piece.units}</div>
      )}
    </div>
  )
}

interface CalendarGroupProps {
  jobId: string
  jobName: string
  clientName?: string
  pieces: CalendarPiece[]
  columnColor?: string
}

function CalendarGroup({ jobName, clientName, pieces, columnColor }: CalendarGroupProps) {
  const totalUnits = pieces.reduce((sum, p) => sum + (p.units || 1), 1)
  
  return (
    <div
      className="rounded border border-border bg-surface-elevated p-2 hover:shadow-sm transition-shadow cursor-pointer"
      style={{ borderLeftColor: columnColor, borderLeftWidth: columnColor ? '3px' : undefined }}
    >
      <div className="font-medium text-text text-xs truncate">{jobName}</div>
      {clientName && (
        <div className="text-text-muted text-xs truncate">{clientName}</div>
      )}
      <div className="mt-1 text-text-muted text-xs">
        {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'}
        {totalUnits > pieces.length && ` · ${totalUnits} units`}
      </div>
    </div>
  )
}

// Desktop Month Grid View
function DesktopMonthView({
  calendarDays,
  monthName,
  weekDays,
  columnColorMap,
  goToPreviousMonth,
  goToNextMonth,
  goToToday,
  t,
}: {
  calendarDays: { date: Date; pieces: CalendarPiece[]; groups: { jobId: string; pieces: CalendarPiece[] }[]; ungrouped: CalendarPiece[]; isCurrentMonth: boolean; isToday: boolean }[]
  monthName: string
  weekDays: string[]
  columnColorMap: Map<string, string>
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void
  t: (key: string) => string
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded hover:bg-surface-elevated text-text"
            aria-label={t('calendar.previousMonth')}
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-text min-w-[200px] text-center">
            {monthName}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded hover:bg-surface-elevated text-text"
            aria-label={t('calendar.nextMonth')}
          >
            →
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 rounded border border-border text-sm text-text hover:bg-surface-elevated"
        >
          {t('calendar.today')}
        </button>
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-text-muted">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`border-r border-b border-border p-1 overflow-hidden ${
              !day.isCurrentMonth ? 'bg-surface-alt' : ''
            } ${day.isToday ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
          >
            <div className={`text-right text-sm mb-1 ${
              day.isToday ? 'font-bold text-blue-600' : 'text-text-muted'
            }`}>
              {day.date.getDate()}
            </div>
            <div className="space-y-1">
              {day.groups.map((group) => (
                <CalendarGroup
                  key={group.jobId}
                  jobId={group.jobId}
                  jobName={group.pieces[0]?.job.description || `Job ${group.jobId}`}
                  clientName={group.pieces[0]?.job.clientName}
                  pieces={group.pieces}
                  columnColor={columnColorMap.get(group.pieces[0]?.status || '')}
                />
              ))}
              {day.ungrouped.map((piece) => (
                <CalendarCard
                  key={piece.id}
                  piece={piece}
                  columnColor={columnColorMap.get(piece.status || '')}
                  showJobName={true}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mobile Day List View
function MobileDayListView({
  daysWithPieces,
  columnColorMap,
  goToPreviousDay,
  goToNextDay,
  goToToday,
  t,
}: {
  daysWithPieces: { date: Date; pieces: CalendarPiece[]; groups: { jobId: string; pieces: CalendarPiece[] }[]; ungrouped: CalendarPiece[]; isToday: boolean }[]
  columnColorMap: Map<string, string>
  goToPreviousDay: () => void
  goToNextDay: () => void
  goToToday: () => void
  t: (key: string) => string
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded hover:bg-surface-elevated text-text"
            aria-label={t('calendar.previousDay')}
          >
            ←
          </button>
          <h2 className="text-base font-semibold text-text">
            {t('calendar.upcomingDays')}
          </h2>
          <button
            onClick={goToNextDay}
            className="p-2 rounded hover:bg-surface-elevated text-text"
            aria-label={t('calendar.nextDay')}
          >
            →
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 rounded border border-border text-sm text-text hover:bg-surface-elevated"
        >
          {t('calendar.today')}
        </button>
      </div>

      {/* Day list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {daysWithPieces.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            {t('calendar.noUpcomingPieces')}
          </div>
        ) : (
          daysWithPieces.slice(0, 30).map((day) => (
            <div key={formatDateKey(day.date)} className="border-b border-border pb-4">
              <div className={`text-sm font-medium mb-2 ${day.isToday ? 'text-blue-600' : 'text-text-muted'}`}>
                {formatDayLabel(day.date, t)}
              </div>
              <div className="space-y-2">
                {day.groups.map((group) => (
                  <CalendarGroup
                    key={group.jobId}
                    jobId={group.jobId}
                    jobName={group.pieces[0]?.job.description || `Job ${group.jobId}`}
                    clientName={group.pieces[0]?.job.clientName}
                    pieces={group.pieces}
                    columnColor={columnColorMap.get(group.pieces[0]?.status || '')}
                  />
                ))}
                {day.ungrouped.map((piece) => (
                  <CalendarCard
                    key={piece.id}
                    piece={piece}
                    columnColor={columnColorMap.get(piece.status || '')}
                    showJobName={true}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function CalendarView() {
  const { t } = useTranslation()
  const { data: metadata } = useShopMetadata()
  const { pieces, jobs, clients } = useWorkbookEntities()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mobileOffset, setMobileOffset] = useState(0)
  
  const kanbanColumns = metadata?.kanbanColumns
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const activePieces = useMemo(() => {
    return pieces.filter((p) => isActiveRow(p))
  }, [pieces])
  
  const activeJobs = useMemo(() => {
    const jobMap = new Map(jobs.filter((j) => isActiveRow(j)).map((j) => [j.id, j]))
    return jobMap
  }, [jobs])
  
  const clientMap = useMemo(() => {
    return new Map(clients.filter((c) => isActiveRow(c)).map((c) => [c.id, c]))
  }, [clients])
  
  const columnColorMap = useMemo(() => {
    const map = new Map<string, string>()
    kanbanColumns?.forEach((col) => {
      map.set(col.name, col.color)
    })
    return map
  }, [kanbanColumns])
  
  const enrichedPieces: CalendarPiece[] = useMemo(() => {
    const result: CalendarPiece[] = []
    for (const piece of activePieces) {
      const job = activeJobs.get(piece.job_id)
      if (!job) continue
      const client = job.client_id ? clientMap.get(job.client_id) : undefined
      result.push({
        ...piece,
        job: {
          ...job,
          clientName: client?.name,
        },
      })
    }
    return result
  }, [activePieces, activeJobs, clientMap])
  
  const piecesByDate = useMemo(() => {
    const map = new Map<string, CalendarPiece[]>()
    
    for (const piece of enrichedPieces) {
      const dueDate = piece.job.due_date
      if (!dueDate) continue
      
      const date = new Date(dueDate)
      const key = formatDateKey(date)
      
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(piece)
    }
    
    return map
  }, [enrichedPieces])
  
  // Desktop: calendar grid
  const calendarDays = useMemo(() => {
    const grid = getCalendarGrid(year, month)
    const today = new Date()
    
    return grid.map((date) => {
      const key = formatDateKey(date)
      const dayPieces = piecesByDate.get(key) || []
      
      const groups: { jobId: string; pieces: CalendarPiece[] }[] = []
      let currentGroup: { jobId: string; pieces: CalendarPiece[] } | null = null
      const ungrouped: CalendarPiece[] = []
      
      for (const piece of dayPieces) {
        if (currentGroup && currentGroup.jobId === piece.job_id) {
          currentGroup.pieces.push(piece)
        } else {
          if (currentGroup) {
            if (currentGroup.pieces.length === 1) {
              ungrouped.push(currentGroup.pieces[0])
            } else {
              groups.push(currentGroup)
            }
          }
          currentGroup = { jobId: piece.job_id, pieces: [piece] }
        }
      }
      
      if (currentGroup) {
        if (currentGroup.pieces.length === 1) {
          ungrouped.push(currentGroup.pieces[0])
        } else {
          groups.push(currentGroup)
        }
      }
      
      return {
        date,
        pieces: dayPieces,
        groups,
        ungrouped,
        isCurrentMonth: date.getMonth() === month,
        isToday: isSameDay(date, today),
      }
    })
  }, [year, month, piecesByDate])
  
  // Mobile: days with pieces (upcoming)
  const daysWithPieces = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const days: { date: Date; pieces: CalendarPiece[]; groups: { jobId: string; pieces: CalendarPiece[] }[]; ungrouped: CalendarPiece[]; isToday: boolean }[] = []
    
    // Get next 60 days
    for (let i = mobileOffset; i < mobileOffset + 60; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const key = formatDateKey(date)
      const dayPieces = piecesByDate.get(key) || []
      
      if (dayPieces.length > 0) {
        const groups: { jobId: string; pieces: CalendarPiece[] }[] = []
        let currentGroup: { jobId: string; pieces: CalendarPiece[] } | null = null
        const ungrouped: CalendarPiece[] = []
        
        for (const piece of dayPieces) {
          if (currentGroup && currentGroup.jobId === piece.job_id) {
            currentGroup.pieces.push(piece)
          } else {
            if (currentGroup) {
              if (currentGroup.pieces.length === 1) {
                ungrouped.push(currentGroup.pieces[0])
              } else {
                groups.push(currentGroup)
              }
            }
            currentGroup = { jobId: piece.job_id, pieces: [piece] }
          }
        }
        
        if (currentGroup) {
          if (currentGroup.pieces.length === 1) {
            ungrouped.push(currentGroup.pieces[0])
          } else {
            groups.push(currentGroup)
          }
        }
        
        days.push({
          date,
          pieces: dayPieces,
          groups,
          ungrouped,
          isToday: isSameDay(date, today),
        })
      }
    }
    
    return days
  }, [piecesByDate, mobileOffset])
  
  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
    setMobileOffset(0)
  }
  
  const goToPreviousDay = () => {
    setMobileOffset((prev) => Math.max(0, prev - 7))
  }
  
  const goToNextDay = () => {
    setMobileOffset((prev) => prev + 7)
  }
  
  return (
    <>
      {/* Desktop: Month Grid */}
      <div className="hidden md:block h-full">
        <DesktopMonthView
          calendarDays={calendarDays}
          monthName={monthName}
          weekDays={weekDays}
          columnColorMap={columnColorMap}
          goToPreviousMonth={goToPreviousMonth}
          goToNextMonth={goToNextMonth}
          goToToday={goToToday}
          t={t}
        />
      </div>
      
      {/* Mobile: Day List */}
      <div className="md:hidden h-full">
        <MobileDayListView
          daysWithPieces={daysWithPieces}
          columnColorMap={columnColorMap}
          goToPreviousDay={goToPreviousDay}
          goToNextDay={goToNextDay}
          goToToday={goToToday}
          t={t}
        />
      </div>
    </>
  )
}
