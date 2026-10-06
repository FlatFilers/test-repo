import { createSchedule, deleteSchedule, listSchedules, pauseSchedule } from './scheduler'
import { MAX_SCHEDULES_PER_DASHBOARD } from './types'

describe('scheduled exports', () => {
  it('creates a schedule and computes the next run', () => {
    const schedule = createSchedule({
      dashboardId: 'd1',
      name: 'Weekly revenue',
      frequency: 'weekly',
      time: '09:00',
      format: 'csv',
      recipients: ['a@example.com'],
    })
    expect(listSchedules('d1')).toHaveLength(1)
    expect(schedule.nextRunAt).toBeInstanceOf(Date)
    expect(schedule.paused).toBe(false)
  })

  it('enforces the per-dashboard limit', () => {
    for (let i = 0; i < MAX_SCHEDULES_PER_DASHBOARD; i++) {
      createSchedule({ dashboardId: 'd2', name: `s${i}`, frequency: 'daily', time: '08:00', format: 'pdf', recipients: [] })
    }
    expect(() =>
      createSchedule({ dashboardId: 'd2', name: 'one too many', frequency: 'daily', time: '08:00', format: 'pdf', recipients: [] }),
    ).toThrow()
  })

  it('pauses and deletes schedules', () => {
    const schedule = createSchedule({ dashboardId: 'd3', name: 'x', frequency: 'monthly', time: '07:30', format: 'csv', recipients: [] })
    pauseSchedule('d3', schedule.id)
    deleteSchedule('d3', schedule.id)
    expect(listSchedules('d3')).toHaveLength(0)
  })
})
