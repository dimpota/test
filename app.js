const tagoApi = "https://api.eu-w1.tago.io"
const pageToken = "042ee4ac-4e45-4c6f-ae0d-0df638b72f68"

const voltageElement = document.getElementById("voltage")
const powerElement = document.getElementById("power")
const statusElement = document.getElementById("status")

let requestInProgress = false

async function fetchLatestValues() {
    if (requestInProgress) return
    requestInProgress = true
    try {
        const requestHeaders = { "Device-Token": pageToken }
        const [voltageResult, powerResult] = await Promise.all([
            fetch(tagoApi + "/data?variable=voltage&query=last_item", { headers: requestHeaders }).then(response => response.json()),
            fetch(tagoApi + "/data?variable=power&query=last_item", { headers: requestHeaders }).then(response => response.json())
        ])

        if (!voltageResult.status || !powerResult.status || !voltageResult.result || !powerResult.result || !voltageResult.result[0] || !powerResult.result[0]) {
            statusElement.textContent = "περιμένω δεδομένα από το TagoIO…"
            return
        }

        voltageElement.textContent = Number(voltageResult.result[0].value)
        powerElement.textContent = Number(powerResult.result[0].value)
        statusElement.textContent = "updated " + new Date().toLocaleTimeString()
    } catch (error) {
        statusElement.textContent = "TagoIO unreachable"
    } finally {
        requestInProgress = false
    }
}

setInterval(fetchLatestValues, 2000)
fetchLatestValues()