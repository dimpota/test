const LIMIT = 10
const TAGO_API = "https://api.eu-w1.tago.io"
const PAGE_TOKEN = "042ee4ac-4e45-4c6f-ae0d-0df638b72f68"

const tbody = document.getElementById("tbody")
const statusEl = document.getElementById("status")
const voltageEl = document.getElementById("voltage")
const powerEl = document.getElementById("power")

let series = []
let busy = false

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
            statusEl.textContent = "TagoIO: no data (τρέχει το sender;)"
            return
        }

        series.push({
            time: v.result[0].time,
            voltage: Number(v.result[0].value),
            power: Number(p.result[0].value)
        })
        series = series.slice(-LIMIT)
        render()
    } catch (e) {
        statusEl.textContent = "TagoIO unreachable"
    } finally {
        busy = false
    }
}

function fmtTime(iso) {
    const d = new Date(iso)
    return isNaN(d) ? iso : d.toLocaleTimeString("el-GR")
}

function render() {
    const n = series.length
    if (n === 0) {
        statusEl.textContent = "περιμένω δεδομένα από το TagoIO…"
        return
    }
    const latest = series[n - 1]
    voltageEl.textContent = latest.voltage
    powerEl.textContent = latest.power

    tbody.innerHTML = ""
    series.forEach((e, i) => {
        const tr = document.createElement("tr")
        tr.innerHTML = "<td>" + (n - i) + "</td><td>" + fmtTime(e.time) + "</td><td>" + e.voltage + "</td><td>" + e.power + "</td>"
        tbody.appendChild(tr)
    })
    drawChart()
    statusEl.textContent = "live από TagoIO — updated " + new Date().toLocaleTimeString("el-GR") + " — " + n + "/" + LIMIT + " σημεία"
}

function drawChart() {
    const canvas = document.getElementById("chart")
    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawLine(ctx, series.map(e => e.voltage), "#4fc3f7", "Voltage")
    drawLine(ctx, series.map(e => e.power), "#ffb74d", "Power")
}

function drawLine(ctx, values, color, label) {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    const max = Math.max(...values)
    const min = Math.min(...values)
    const span = (max - min) || 1
    values.forEach((v, i) => {
        const x = (i / (values.length - 1 || 1)) * (ctx.canvas.width - 40) + 20
        const y = 20 + (1 - (v - min) / span) * (ctx.canvas.height - 50)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.fillStyle = color
    ctx.font = "13px Arial"
    ctx.fillText(label, ctx.canvas.width - 70, 16)
}

document.getElementById("btnRefresh").addEventListener("click", fetchLatest)

setInterval(fetchLatest, 2000)
fetchLatest()