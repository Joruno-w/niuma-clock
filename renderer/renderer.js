const STORAGE_KEY = 'niuma-clock:settings'

const DEFAULTS = {
  hireDate: { year: 2022, month: 7, day: 5 },
  monthlySalary: 17000,
  workStartHour: '10:00',
  workEndHour: '19:30',
  workdays: [1, 2, 3, 4, 5],
  showIncome: true,
  theme: { preset: 'coffee', custom: null }
}

function readSettingsLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

function writeSettingsLocal(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch {}
}

function getSettings() { return readSettingsLocal() }
function saveSettings(s) { writeSettingsLocal(s) }

// 主题预设值
const THEME_PRESETS = {
  coffee: { bg:'#f7f5f2', card:'#ffffff', brand:'#b08b59', text:'#2d2a26', muted:'#8a8a8a', border:'#e6e2dc' },
  light: { bg:'#f6f7fb', card:'#ffffff', brand:'#4b7bec', text:'#1f2937', muted:'#6b7280', border:'#e5e7eb' },
  dark: { bg:'#0f1115', card:'#171923', brand:'#7dd3fc', text:'#e5e7eb', muted:'#9ca3af', border:'#232a34' },
  emerald: { bg:'#f1fbf6', card:'#ffffff', brand:'#10b981', text:'#065f46', muted:'#6b7280', border:'#d1fae5' }
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme.preset && theme.preset !== 'custom') {
    root.setAttribute('data-theme', theme.preset)
    const preset = THEME_PRESETS[theme.preset]
    if (preset) setThemeVars(preset)
  } else if (theme.custom) {
    root.setAttribute('data-theme', 'custom')
    setThemeVars(theme.custom)
  }
}

function setThemeVars(vars) {
  const root = document.documentElement
  root.style.setProperty('--bg', vars.bg)
  root.style.setProperty('--card', vars.card)
  root.style.setProperty('--brand', vars.brand)
  root.style.setProperty('--text', vars.text)
  root.style.setProperty('--muted', vars.muted)
  root.style.setProperty('--border', vars.border)
}

// UI refs
const refs = {
  topProgress: document.getElementById('topProgress'),
  d: {
    day: document.getElementById('d_day'),
    hour: document.getElementById('d_hour'),
    min: document.getElementById('d_min'),
    sec: document.getElementById('d_sec')
  },
  offTime: document.getElementById('offTime'),
  v: {
    today: document.getElementById('v_today'),
    month: document.getElementById('v_month'),
    year: document.getElementById('v_year'),
    hourly: document.getElementById('v_hourly'),
    employed: document.getElementById('v_employed')
  },
  btnSettings: document.getElementById('btnSettings'),
  dlg: document.getElementById('dlg'),
  hireYear: document.getElementById('hireYear'),
  hireMonth: document.getElementById('hireMonth'),
  hireDay: document.getElementById('hireDay'),
  salary: document.getElementById('salary'),
  start: document.getElementById('start'),
  end: document.getElementById('end'),
  week: document.querySelectorAll('.week input[type="checkbox"]'),
  showIncomeRadio: document.querySelectorAll('input[name="showIncome"]'),
  btnBack: document.getElementById('btnBack'),
  btnSave: document.getElementById('btnSave'),
  themePreset: document.getElementById('themePreset'),
  customFields: document.getElementById('customThemeFields'),
  c_brand: document.getElementById('c_brand'),
  c_bg: document.getElementById('c_bg'),
  c_card: document.getElementById('c_card'),
  c_text: document.getElementById('c_text'),
  c_muted: document.getElementById('c_muted'),
  c_border: document.getElementById('c_border')
}

let state = getSettings()
applyTheme(state.theme)

function formatMoney(n) { return '¥' + (n || 0).toFixed(2) }

function updateDialogFromState() {
  refs.hireYear.value = state.hireDate.year
  refs.hireMonth.value = state.hireDate.month
  refs.hireDay.value = state.hireDate.day
  refs.salary.value = state.monthlySalary
  refs.start.value = state.workStartHour
  refs.end.value = state.workEndHour
  refs.week.forEach((el) => { el.checked = state.workdays.includes(Number(el.value)) })
  refs.showIncomeRadio.forEach((el) => { el.checked = (el.value === '1') === state.showIncome })

  refs.themePreset.value = state.theme.preset || 'coffee'
  const custom = state.theme.custom || THEME_PRESETS.coffee
  refs.c_brand.value = toColor(custom.brand)
  refs.c_bg.value = toColor(custom.bg)
  refs.c_card.value = toColor(custom.card)
  refs.c_text.value = toColor(custom.text)
  refs.c_muted.value = toColor(custom.muted)
  refs.c_border.value = toColor(custom.border)
  toggleCustomFields()
}

function toColor(v){
  const s = String(v)
  return s.startsWith('#') ? s : s
}

function readDialogToState() {
  const workdays = Array.from(refs.week).filter((el) => el.checked).map((el) => Number(el.value))
  const showIncome = Array.from(refs.showIncomeRadio).find((el) => el.checked)?.value === '1'

  const preset = refs.themePreset.value
  const custom = {
    brand: refs.c_brand.value,
    bg: refs.c_bg.value,
    card: refs.c_card.value,
    text: refs.c_text.value,
    muted: refs.c_muted.value,
    border: refs.c_border.value
  }

  state = {
    ...state,
    hireDate: {
      year: Number(refs.hireYear.value || state.hireDate.year),
      month: Number(refs.hireMonth.value || state.hireDate.month),
      day: Number(refs.hireDay.value || state.hireDate.day)
    },
    monthlySalary: Number(refs.salary.value || state.monthlySalary),
    workStartHour: refs.start.value || state.workStartHour,
    workEndHour: refs.end.value || state.workEndHour,
    workdays: workdays.length ? workdays : state.workdays,
    showIncome,
    theme: { preset, custom: preset === 'custom' ? custom : null }
  }
  saveSettings(state)
  applyTheme(state.theme)
}

function toggleCustomFields(){
  const preset = refs.themePreset.value
  refs.customFields.style.display = preset === 'custom' ? 'grid' : 'none'
}

refs.themePreset?.addEventListener('change', toggleCustomFields)

// 兼容不支持 <dialog> 的环境
function openDialog() {
  try { if (typeof refs.dlg.showModal === 'function') { refs.dlg.showModal(); return } } catch(_){}
  refs.dlg.setAttribute('open', '')
}
function closeDialog() {
  try { if (typeof refs.dlg.close === 'function') { refs.dlg.close(); return } } catch(_){}
  refs.dlg.removeAttribute('open')
}

// 计算收益与倒计时（今日收益始终随时间增长，不受工作日开关影响）
function calcSalaryProgress({ monthlySalary, workStartHour, workEndHour, workdays }) {
  const now = new Date()
  const start = new Date(now)
  const [sH, sM] = workStartHour.split(':').map(Number)
  start.setHours(sH, sM, 0, 0)
  const end = new Date(now)
  const [eH, eM] = workEndHour.split(':').map(Number)
  end.setHours(eH, eM, 0, 0)

  const workMs = Math.max(0, end - start)
  const nowClamped = Math.max(0, Math.min(now - start, workMs))

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  let monthWorkdays = 0
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (workdays.includes(d.getDay())) monthWorkdays += 1
  }
  const dailySalary = monthWorkdays > 0 ? monthlySalary / monthWorkdays : 0
  const hourlySalary = workMs > 0 ? dailySalary / (workMs / 3600000) : 0

  // 今日收益：不依赖工作日勾选，只按时间段线性增长
  const todayEarn = hourlySalary * (nowClamped / 3600000)

  // 本月收益：历史工作日按整日累计，今天按动态进度累计
  let monthEarn = 0
  for (let d = new Date(firstDay); d <= now; d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    if (d.toDateString() === now.toDateString()) {
      monthEarn += todayEarn
    } else if (workdays.includes(w)) {
      monthEarn += dailySalary
    }
  }

  // 今年收益：历史月份按整月估算，当前月用上面的 monthEarn
  let yearEarn = 0
  for (let m = 0; m <= now.getMonth(); m += 1) {
    const fm = new Date(now.getFullYear(), m, 1)
    const lm = new Date(now.getFullYear(), m + 1, 0)
    let mDays = 0
    for (let d = new Date(fm); d <= lm; d.setDate(d.getDate() + 1)) {
      if (workdays.includes(d.getDay())) mDays += 1
    }
    const mDaily = mDays > 0 ? monthlySalary / mDays : 0
    if (m < now.getMonth()) yearEarn += mDays * mDaily
    else yearEarn += monthEarn
  }

  const remainMs = Math.max(0, end - now)
  const remain = splitMs(remainMs)

  const weekday = now.getDay()
  const isWorkday = workdays.includes(weekday)

  return { isWorkday, todayEarn, monthEarn, yearEarn, hourlySalary, remain, workEnd: workEndHour }
}

function splitMs(ms){
  const sec = Math.floor(ms/1000)
  const days = Math.floor(sec/86400)
  const hours = Math.floor((sec%86400)/3600)
  const minutes = Math.floor((sec%3600)/60)
  const seconds = sec%60
  return { days, hours, minutes, seconds }
}

function render(){
  const { todayEarn, monthEarn, yearEarn, hourlySalary, remain, workEnd } = calcSalaryProgress(state)
  refs.offTime.textContent = workEnd
  refs.d.day.textContent = remain.days
  refs.d.hour.textContent = String(remain.hours).padStart(2,'0')
  refs.d.min.textContent = String(remain.minutes).padStart(2,'0')
  refs.d.sec.textContent = String(remain.seconds).padStart(2,'0')

  const dailyMs = (()=>{ const [sH2,sM2] = state.workStartHour.split(':').map(Number); const [eH2,eM2] = state.workEndHour.split(':').map(Number); return (eH2*60+eM2-(sH2*60+sM2))*60*1000 })()
  const now = new Date()
  const s = new Date(now)
  const [sH,sM] = state.workStartHour.split(':').map(Number)
  s.setHours(sH,sM,0,0)
  const progress = Math.max(0, Math.min(1, (now - s)/dailyMs))
  refs.topProgress.style.width = `${(progress*100).toFixed(2)}%`

  if (state.showIncome) {
    refs.v.today.textContent = formatMoney(todayEarn)
    refs.v.month.textContent = formatMoney(monthEarn)
    refs.v.year.textContent = formatMoney(yearEarn)
  } else {
    refs.v.today.textContent = '—'
    refs.v.month.textContent = '—'
    refs.v.year.textContent = '—'
  }
  refs.v.hourly.textContent = `时薪：${formatMoney(hourlySalary)}/时`

  const hire = new Date(state.hireDate.year, state.hireDate.month-1, state.hireDate.day)
  const days = Math.floor((now - hire)/86400000)
  refs.v.employed.textContent = `入职 ${days} 天`
}

// 事件绑定
refs.btnSettings.addEventListener('click', () => { updateDialogFromState(); openDialog() })
refs.btnSave.addEventListener('click', () => { readDialogToState(); closeDialog() })
refs.btnBack.addEventListener('click', (e) => { e.preventDefault(); closeDialog() })

// 初始化 + 每秒刷新
updateDialogFromState()
render()
setInterval(render, 1000)
