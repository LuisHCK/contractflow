import { database } from '@/database'
import { PAYMENT_SCHEDULES, SCHEDULE_INSTALLMENTS } from '@/database/queries'
import { getStageById } from '@/services/stages'
import { normalizeExchangeRate, toBaseAmount } from '@/utils/money'
import { addDays, addMonths, format, getISODay, parse } from 'date-fns'

const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly']
const STEP_DAYS = { daily: 1, weekly: 7, biweekly: 14 }

const round2 = (n) => Math.round(n * 100) / 100

const snapToWeekday = (date, weekday) => {
    const iso = getISODay(date) - 1
    return addDays(date, (weekday - iso + 7) % 7)
}

const advance = (date, frequency, interval) => {
    if (frequency === 'monthly') return addMonths(date, interval)
    return addDays(date, STEP_DAYS[frequency] * interval)
}

/**
 * Pure helper: split `total` into `count` equal installments on a recurring schedule.
 * The last installment absorbs the rounding remainder so the sum is exact.
 * @returns {{installmentNumber:number,dueDate:string,amount:number}[]}
 */
export const generateInstallments = ({ total, count, frequency, interval = 1, weekday, startDate }) => {
    const totalCents = Math.round(total * 100)
    const baseCents = Math.floor(totalCents / count)

    let cursor = parse(startDate, 'yyyy-MM-dd', new Date())
    const usesWeekday =
        (frequency === 'weekly' || frequency === 'biweekly') &&
        weekday !== null && weekday !== undefined && weekday !== ''

    if (usesWeekday) cursor = snapToWeekday(cursor, Number(weekday))

    const installments = []
    for (let i = 0; i < count; i++) {
        installments.push({
            installmentNumber: i + 1,
            dueDate: format(cursor, 'yyyy-MM-dd'),
            amount: i === count - 1 ? (totalCents - baseCents * (count - 1)) / 100 : baseCents / 100
        })
        cursor = advance(cursor, frequency, Number(interval) || 1)
    }

    return installments
}

const parseWeekday = (weekday) => {
    if (weekday === null || weekday === undefined || weekday === '') return null
    const value = Number(weekday)
    return Number.isInteger(value) && value >= 0 && value <= 6 ? value : null
}

/**
 * Create a payment schedule for a stage (equal-split fixed plan).
 * @returns {Promise<object|null>} The created schedule + installments, or null on failure.
 */
export const createSchedule = async ({ stageId, installmentCount, frequency, interval, weekday, startDate, createdBy }) => {
    const stage = await getStageById(stageId)
    if (!stage?.id) return null

    if (await getScheduleByStage(stageId)) return null

    const count = Number(installmentCount)
    if (!Number.isInteger(count) || count < 1) return null

    const total = round2(Number(stage.estimatedCost || 0))
    if (total <= 0) return null

    if (!FREQUENCIES.includes(frequency)) return null

    const weekdayNum = parseWeekday(weekday)
    if (weekday !== null && weekday !== undefined && weekday !== '' && weekdayNum === null) return null

    const exchangeRate = normalizeExchangeRate(stage.exchangeRate || 1)
    const totalBase = toBaseAmount(total, exchangeRate)
    const installments = generateInstallments({ total, count, frequency, interval, weekday, startDate })

    const scheduleId = await database.begin(async (tx) => {
        const rows = await tx.unsafe(PAYMENT_SCHEDULES.ADD, [
            stageId, total, totalBase, stage.displayCurrencyCode, stage.displayCurrencySymbol,
            exchangeRate, 'fixed', frequency, Number(interval) || 1, weekdayNum, count, startDate, createdBy
        ])
        const id = rows?.[0]?.id
        if (!id) throw new Error('Failed to insert payment schedule')

        for (const inst of installments) {
            await tx.unsafe(SCHEDULE_INSTALLMENTS.ADD, [
                id, inst.installmentNumber, inst.dueDate, inst.amount, toBaseAmount(inst.amount, exchangeRate)
            ])
        }
        return id
    })

    if (!scheduleId) return null
    return getScheduleByStage(stageId)
}

const toSchedule = (row, installments) => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    const items = installments.map((inst) => ({
        installmentNumber: inst.installment_number,
        dueDate: inst.due_date,
        amount: Number(inst.amount || 0),
        overdue: inst.due_date < todayStr
    }))

    const next = items.find((inst) => !inst.overdue)

    return {
        id: row.id,
        stageId: row.stage_id,
        totalAmount: Number(row.total_amount || 0),
        displayCurrencyCode: row.display_currency_code,
        displayCurrencySymbol: row.display_currency_symbol,
        frequency: row.frequency,
        interval: row.interval,
        weekday: row.weekday,
        installmentCount: row.installment_count,
        startDate: row.start_date,
        installments: items,
        nextDueDate: next?.dueDate || null
    }
}

/**
 * Get a stage's schedule (with installments), or null if none exists.
 */
export const getScheduleByStage = async (stageId) => {
    try {
        const rows = await database.unsafe(PAYMENT_SCHEDULES.GET_BY_STAGE, [stageId])
        const schedule = rows?.[0]
        if (!schedule?.id) return null

        const installments = await database.unsafe(SCHEDULE_INSTALLMENTS.GET_BY_SCHEDULE, [schedule.id])
        return toSchedule(schedule, installments)
    } catch (error) {
        console.error(`Error fetching payment schedule: ${error.message}`)
        return null
    }
}

/**
 * Soft-delete a stage's schedule.
 * @returns {Promise<boolean>}
 */
export const deleteScheduleByStage = async (stageId) => {
    try {
        const schedule = await getScheduleByStage(stageId)
        if (!schedule?.id) return false
        await database.unsafe(PAYMENT_SCHEDULES.SOFT_DELETE, [schedule.id])
        return true
    } catch (error) {
        console.error(`Error deleting payment schedule: ${error.message}`)
        return false
    }
}
