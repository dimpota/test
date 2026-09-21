const LIMIT = 10
const DATA_URL = "https://raw.githubusercontent.com/dimpota/test/data/data.json"
const API_URL = "https://api.github.com/repos/dimpota/test/contents/data.json?ref=data"
const tbody = document.getElementById("tbody")
const statusEl = document.getElementById("status")
const voltageEl = document.getElementById("voltage")
const powerEl = document.getElementById("power")

let last = []
let all = []

async function fetchData() {
    let res = null
    try {
        res = await fetch(DATA_URL + "?t=" + Date.now(), { cache: "no-store" })
    } catch (e) {
        statusEl.textContent = "server unreachable: " + DATA_URL
        return
    }
    if (!res.ok) {
        statusEl.textContent = "server error " + res.status
        return
    }
    all = await res.json()
    if (!Array.isArray(all)) all = []
    last = all.slice(-LIMIT)
    render()
}

function fmtTime(iso) {
    const d = new Date(iso)
    return isNaN(d) ? iso : d.toLocaleTimeString("el-GR")
}

function render() {
    const n = last.length
    if (n === 0) { statusEl.textContent = "Î´ÎµÎ½ Ï…Ï€Î¬ÏÏ‡Î¿Ï…Î½ Î±ÎºÏŒÎ¼Î· Î´ÎµÎ´Î¿Î¼Î­Î½Î±"; return }
    const latest = last[n - 1]
    voltageEl.textContent = latest.voltage
    powerEl.textContent = latest.power

    tbody.innerHTML = ""
    last.forEach((e, i) => {
        const tr = document.createElement("tr")
        tr.innerHTML = "<td>" + (n - i) + "</td><td>" + fmtTime(e.time) + "</td><td>" + e.voltage + "</td><td>" + e.power + "</td>"
        tbody.appendChild(tr)
    })
    drawChart()
    statusEl.textContent = "updated " + new Date().toLocaleTimeString("el-GR") + " â€” " + all.length + " Î¼ÎµÏ„ÏÎ®ÏƒÎµÎ¹Ï‚"
}

function drawChart() {
    const canvas = document.getElementById("chart")
    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawLine(ctx, last.map(e => e.voltage), "#4fc3f7", "Voltage")
    drawLine(ctx, last.map(e => e.power), "#ffb74d", "Power")
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

async function manualRefresh() {
    const btn = document.getElementById("btnRefresh")
    btn.disabled = true
    const res = await fetch(API_URL, {
        headers: {
            "Accept": "application/vnd.github+json",
            "User-Agent": "live-iot-page"
        }
    })
    if (res.status === 403) {
        statusEl.textContent = "API rate limit â€” Î´Î¿ÎºÎ¯Î¼Î±ÏƒÎµ Î¾Î±Î½Î¬ ÏƒÎµ Î»Î¯Î³Î¿ (60/h)"
        btn.disabled = false
        return
    }
    if (!res.ok) {
        statusEl.textContent = "API error " + res.status
        btn.disabled = false
        return
    }
    const data = await res.json()
    const txt = atob(data.content)
    let parsed
    try {
        parsed = JSON.parse(txt)
    } catch (e) {
        statusEl.textContent = "parse error"
        btn.disabled = false
        return
    }
    all = Array.isArray(parsed) ? parsed : []
    last = all.slice(-LIMIT)
    render()
    statusEl.textContent += " â€” LIVE refresh " + new Date().toLocaleTimeString("el-GR")
    setTimeout(function () { btn.disabled = false }, 1000)
}

setInterval(fetchData, 1000)
fetchData()