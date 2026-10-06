export type ExportFrequency = 'daily' | 'weekly' | 'monthly'
export type ExportFormat = 'csv' | 'pdf'

export interface ScheduledExport {
  id: string
  dashboardId: string
  name: string
  frequency: ExportFrequency
  /** HH:mm in the workspace timezone */
  time: string
  format: ExportFormat
  recipients: string[]
  paused: boolean
  nextRunAt: Date
}

export interface CreateScheduleInput {
  dashboardId: string
  name: string
  frequency: ExportFrequency
  time: string
  format: ExportFormat
  recipients: string[]
}

export const MAX_SCHEDULES_PER_DASHBOARD = 20
