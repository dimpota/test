const LIMIT = 10
const TAGO_API = "https://api.eu-w1.tago.io"
const PAGE_TOKEN = "042ee4ac-4e45-4c6f-ae0d-0df638b72f68"

const canvas = document.getElementById("chart")
const ctx = canvas.getContext("2d")

const M = { left: 58, right: 58, top: 26, bottom: 30 }
const PW = canvas.width - M.left - M.right
const PH = canvas.height - M.top - M.bottom

let series = []
let busy = false
let lastStatus = ""

async function fetchLatest() {
    if (busy) return
    busy = true
    try {
        const headers = { "Device-Token": PAGE_TOKEN }
        const [v, p] = await Promise.all([
            fetch(TAGO_API + "/data?variable=voltage&query=last_item", { headers }).then(r => r.json()),
            fetch(TAGO_API + "/data?variable=power&query=last_item", { headers }).then(r => r.json())
        ])

        if (!v.status || !p.status || !v.result || !p.result || !v.result[0] || !p.result[0]) {
            lastStatus = "περιμένω δεδομένα από το TagoIO…"
            draw()
            return
        }

        series.push({
            time: v.result[0].time,
            voltage: Number(v.result[0].value),
            power: Number(p.result[0].value)
        })
        series = series.slice(-LIMIT)
        lastStatus = ""
        draw()
    } catch (e) {
        lastStatus = "TagoIO unreachable"
        draw()
    } finally {
        busy = false
    }
}

function niceTicks(min, max, count) {
    if (min === max) { min -= 1; max += 1 }
    const span = max - min
    const rawStep = span / count
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const norm = rawStep / mag
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
    const roundedMin = Math.floor(min / step) * step
    const roundedMax = Math.ceil(max / step) * step
    const ticks = []
    for (let t = roundedMin; t <= roundedMax + step / 2; t += step) {
        ticks.push(Math.round(t * 10) / 10)
    }
    return ticks
}

function yFor(value, min, max) {
    const span = (max - min) || 1
    return M.top + (1 - (value - min) / span) * PH
}

function drawGrid(ticks, min, max, color, labelRight) {
    ctx.strokeStyle = color
    ctx.fillStyle = "#bbb"
    ctx.font = "13px Arial"
    ctx.lineWidth = 1
    ticks.forEach(t => {
        const y = yFor(t, min, max)
        ctx.beginPath()
        ctx.moveTo(M.left, y)
        ctx.lineTo(canvas.width - M.right, y)
        ctx.stroke()
        ctx.textAlign = "right"
        ctx.fillText(String(t), M.left - 8, y + 4)
        if (labelRight) ctx.textAlign = "left"
        if (labelRight) ctx.fillText(String(t), canvas.width - M.right + 8, y + 4)
    })
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#1e1e1e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (series.length < 2) {
        ctx.fillStyle = "#888"
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.fillText(lastStatus || "περιμένω δεδομένα…", canvas.width / 2, canvas.height / 2)
        return
    }

    const vMin = Math.min(...series.map(e => e.voltage))
    const vMax = Math.max(...series.map(e => e.voltage))
    const pMin = Math.min(...series.map(e => e.power))
    const pMax = Math.max(...series.map(e => e.power))

    const vTicks = niceTicks(vMin, vMax, 5)
    const pTicks = niceTicks(pMin, pMax, 5)

    drawGrid(vTicks, vTicks[0], vTicks[vTicks.length - 1], "rgba(255,255,255,.12)", false)
    drawGrid(pTicks, pTicks[0], pTicks[pTicks.length - 1], "rgba(255,255,255,.06)", true)

    ctx.strokeStyle = "#555"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(M.left, M.top)
    ctx.lineTo(M.left, M.top + PH)
    ctx.lineTo(canvas.width - M.right, M.top + PH)
    ctx.stroke()

    drawSeries(series.map(e => e.voltage), vTicks[0], vTicks[vTicks.length - 1], "#4fc3f7")
    drawSeries(series.map(e => e.power), pTicks[0], pTicks[pTicks.length - 1], "#ffb74d")

    ctx.fillStyle = "#999"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    const stepX = Math.max(1, Math.floor((series.length - 1) / 5))
    series.forEach((e, i) => {
        if (i % stepX !== 0 && i !== series.length - 1) return
        const d = new Date(e.time)
        ctx.fillText(d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), M.left + (i / (series.length - 1)) * PW, canvas.height - 6)
    })

    ctx.font = "bold 14px Arial"
    ctx.textAlign = "left"
    ctx.fillStyle = "#4fc3f7"
    ctx.fillText("Voltage (V)", M.left + 8, 18)
    ctx.fillStyle = "#ffb74d"
    ctx.textAlign = "right"
    ctx.fillText("Power (W)", canvas.width - M.right - 8, 18)
}

function drawSeries(values, min, max, color) {
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    values.forEach((v, i) => {
        const x = M.left + (i / (values.length - 1 || 1)) * PW
        const y = yFor(v, min, max)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.fillStyle = color
    values.forEach((v, i) => {
        const x = M.left + (i / (values.length - 1 || 1)) * PW
        const y = yFor(v, min, max)
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
    })
}

document.addEventListener("visibilitychange", function () {
    if (!document.hidden) fetchLatest()
})

setInterval(fetchLatest, 2000)
fetchLatest()