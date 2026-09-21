const TAGO_API = "https://api.eu-w1.tago.io"
const PAGE_TOKEN = "042ee4ac-4e45-4c6f-ae0d-0df638b72f68"

const voltageEl = document.getElementById("voltage")
const powerEl = document.getElementById("power")
const statusEl = document.getElementById("status")

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
            statusEl.textContent = "περιμένω δεδομένα από το TagoIO…"
            return
        }

        voltageEl.textContent = Number(v.result[0].value)
        powerEl.textContent = Number(p.result[0].value)
        statusEl.textContent = "updated " + new Date().toLocaleTimeString("el-GR")
    } catch (e) {
        statusEl.textContent = "TagoIO unreachable"
    } finally {
        busy = false
    }
}

setInterval(fetchLatest, 2000)
fetchLatest()