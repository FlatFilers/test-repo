import { ScheduledExport } from './types'

export async function runScheduledExport(
  schedule: ScheduledExport,
  renderDashboard: (dashboardId: string) => Promise<Buffer>,
): Promise<void> {
  try {
    const payload = await formatPayload(schedule.format, schedule, renderDashboard)
    const link = await uploadExport(payload, schedule)
    await emailRecipients(schedule.recipients, link)
  } catch (error) {
    await notifyCreator(schedule, error)
  }
}

async function formatPayload(
  format: 'csv' | 'pdf',
  schedule: ScheduledExport,
  renderDashboard: (dashboardId: string) => Promise<Buffer>,
): Promise<Buffer> {
  const data = await renderDashboard(schedule.dashboardId)
  return format === 'csv' ? data : toPdf(data)
}

function toPdf(data: Buffer): Buffer {
  // Rendering is handled by the export service; this wraps the raw output.
  return data
}

async function uploadExport(payload: Buffer, schedule: ScheduledExport): Promise<string> {
  const key = `exports/${schedule.dashboardId}/${schedule.id}/${Date.now()}`
  await storeObject(key, payload)
  return `https://exports.internal/${key}`
}

async function storeObject(key: string, payload: Buffer): Promise<void> {
  // Export storage client
  void key
  void payload
}

async function emailRecipients(recipients: string[], link: string): Promise<void> {
  // Notification client
  void recipients
  void link
}

async function notifyCreator(schedule: ScheduledExport, error: unknown): Promise<void> {
  // Failed runs notify the creator, never the recipients
  void schedule
  void error
}
