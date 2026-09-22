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

        // HTTP headers
        const requestHeaders = {
            "Device-Token": pageToken
        }


        // -------------------------
        // VOLTAGE
        // -------------------------

        const voltageResponse = await fetch(
            tagoApi + "/data?variable=voltage&query=last_item",
            {
                headers: requestHeaders
            }
        )

        // Παίρνουμε το BODY της απάντησης
        const voltageBody = await voltageResponse.json()


        // -------------------------
        // POWER
        // -------------------------

        const powerResponse = await fetch(
            tagoApi + "/data?variable=power&query=last_item",
            {
                headers: requestHeaders
            }
        )

        // Παίρνουμε το BODY της απάντησης
        const powerBody = await powerResponse.json()


        // -------------------------
        // ΕΛΕΓΧΟΣ
        // -------------------------

        if (
            !voltageBody.status ||
            !powerBody.status ||
            !voltageBody.result ||
            !powerBody.result ||
            !voltageBody.result[0] ||
            !powerBody.result[0]
        ) {
            statusElement.textContent = "περιμένω δεδομένα από το TagoIO…"
            return
        }


        // -------------------------
        // ΕΜΦΑΝΙΣΗ
        // -------------------------

        voltageElement.textContent =
            Number(voltageBody.result[0].value)

        powerElement.textContent =
            Number(powerBody.result[0].value)

        statusElement.textContent =
            "updated " + new Date().toLocaleTimeString()


    } catch (error) {

        statusElement.textContent = "TagoIO unreachable"

    } finally {

        requestInProgress = false
    }
}


// Κάθε 2 δευτερόλεπτα
setInterval(fetchLatestValues, 2000)

// Κάνε το πρώτο request αμέσως
fetchLatestValues()
