import { contextBridge } from 'electron'

const STORAGE_KEY = 'niuma-clock:settings'

// 读取/写入 localStorage 的封装（渲染端也可直接用，但这里保证统一校验）
function readSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

function calcSalaryProgress({
  monthlySalary,
  workStartHour,
  workEndHour,
  workdays,
  hireDate
}) {
  const now = new Date()

  // 计算今日是否工作日
  const weekday = now.getDay() // 0 周日
  const isWorkday = workdays.includes(weekday)

  const start = new Date(now)
  const [sH, sM] = workStartHour.split(':').map(Number)
  start.setHours(sH, sM, 0, 0)

  const end = new Date(now)
  const [eH, eM] = workEndHour.split(':').map(Number)
  end.setHours(eH, eM, 0, 0)

  const workMs = Math.max(0, end - start)

  const nowClamped = Math.max(0, Math.min(now - start, workMs))

  // 月度信息
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // 工作日统计（按设定的 workdays）
  let monthWorkdays = 0
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (workdays.includes(d.getDay())) monthWorkdays += 1
  }

  const dailySalary = monthWorkdays > 0 ? monthlySalary / monthWorkdays : 0
  const hourlySalary = workMs > 0 ? dailySalary / (workMs / 3600000) : 0

  // 今日收益（若非工作日则为 0）
  const todayEarn = isWorkday ? (hourlySalary * (nowClamped / 3600000)) : 0

  // 本月收益（到今天为止，含今天的进度）
  let monthEarn = 0
  for (let d = new Date(firstDay); d <= now; d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    if (!workdays.includes(w)) continue
    if (d.toDateString() === now.toDateString()) {
      monthEarn += todayEarn
    } else {
      monthEarn += dailySalary
    }
  }

  // 今年收益（简单按月份累计，粗略估计）
  let yearEarn = 0
  for (let m = 0; m <= now.getMonth(); m += 1) {
    // 对每个月重新计算工作日天数
    const fm = new Date(now.getFullYear(), m, 1)
    const lm = new Date(now.getFullYear(), m + 1, 0)
    let mDays = 0
    for (let d = new Date(fm); d <= lm; d.setDate(d.getDate() + 1)) {
      if (workdays.includes(d.getDay())) mDays += 1
    }
    const monthEarnConst = m < now.getMonth() ? (mDays * dailySalary) : monthEarn
    yearEarn += monthEarnConst
  }

  const timeToOffMs = Math.max(0, end - now)
  const remain = splitMs(timeToOffMs)

  return {
    isWorkday,
    todayEarn,
    monthEarn,
    yearEarn,
    hourlySalary,
    remain,
    workEnd: end.toTimeString().slice(0, 5)
  }
}

function splitMs(ms) {
  const sec = Math.floor(ms / 1000)
  const days = Math.floor(sec / 86400)
  const hours = Math.floor((sec % 86400) / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = sec % 60
  return { days, hours, minutes, seconds }
}

contextBridge.exposeInMainWorld('niuma', {
  readSettings,
  writeSettings,
  calcSalaryProgress
})
