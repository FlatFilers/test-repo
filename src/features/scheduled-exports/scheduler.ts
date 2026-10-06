import { CreateScheduleInput, MAX_SCHEDULES_PER_DASHBOARD, ScheduledExport } from './types'

const schedules = new Map<string, ScheduledExport[]>()

export function createSchedule(input: CreateScheduleInput): ScheduledExport {
  const existing = schedules.get(input.dashboardId) ?? []
  if (existing.length >= MAX_SCHEDULES_PER_DASHBOARD) {
    throw new Error(`A dashboard can have at most ${MAX_SCHEDULES_PER_DASHBOARD} schedules`)
  }
  const schedule: ScheduledExport = {
    ...input,
    id: crypto.randomUUID(),
    paused: false,
    nextRunAt: computeNextRun(input.frequency, input.time),
  }
  schedules.set(input.dashboardId, [...existing, schedule])
  return schedule
}

export function listSchedules(dashboardId: string): ScheduledExport[] {
  return schedules.get(dashboardId) ?? []
}

export function pauseSchedule(dashboardId: string, scheduleId: string): void {
  findSchedule(dashboardId, scheduleId).paused = true
}

export function resumeSchedule(dashboardId: string, scheduleId: string): void {
  findSchedule(dashboardId, scheduleId).paused = false
}

export function deleteSchedule(dashboardId: string, scheduleId: string): void {
  const remaining = listSchedules(dashboardId).filter((s) => s.id !== scheduleId)
  schedules.set(dashboardId, remaining)
}

function findSchedule(dashboardId: string, scheduleId: string): ScheduledExport {
  const schedule = listSchedules(dashboardId).find((s) => s.id === scheduleId)
  if (!schedule) throw new Error(`Schedule ${scheduleId} not found`)
  return schedule
}

function computeNextRun(frequency: 'daily' | 'weekly' | 'monthly', time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)
  while (next.getTime() <= Date.now()) advance(next, frequency)
  return next
}

function advance(date: Date, frequency: 'daily' | 'weekly' | 'monthly'): void {
  if (frequency === 'daily') date.setDate(date.getDate() + 1)
  if (frequency === 'weekly') date.setDate(date.getDate() + 7)
  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1)
}
