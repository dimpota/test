const tagoApi = "https://api.eu-w1.tago.io"
const pageToken = "042ee4ac-4e45-4c6f-ae0d-0df638b72f68"


const voltageElement = document.getElementById("voltage")
const powerElement = document.getElementById("power")
const statusElement = document.getElementById("status")

let requestInProgress = false



async function fetchLatestValues() {

    if (requestInProgress) return

    requestInProgress = true


    // VOLTAGE

    const voltageResponse = await fetch(
        tagoApi + "/data?variable=voltage&query=last_item",
        {
            headers: {"Device-Token": pageToken}
        }
    )

    const voltageText = await voltageResponse.text()

    console.log(
        "tago voltage:",
        voltageResponse.ok
            ? voltageResponse.status + " OK"
            : "ERROR " + voltageResponse.status,
        voltageText
    )


    // POWER

    const powerResponse = await fetch(
        tagoApi + "/data?variable=power&query=last_item",
        {
            headers: {"Device-Token": pageToken}
        }
    )

    const powerText = await powerResponse.text()

    console.log(
        "tago power:",
        powerResponse.ok
            ? powerResponse.status + " OK"
            : "ERROR " + powerResponse.status,
        powerText
    )


    // TEXT → JAVASCRIPT OBJECT

    const voltageBody = JSON.parse(voltageText)

    const powerBody = JSON.parse(powerText)


    // CHECK DATA

    if (
        !voltageBody.status ||
        !powerBody.status ||
        !voltageBody.result ||
        !powerBody.result ||
        !voltageBody.result[0] ||
        !powerBody.result[0]
    ) {
        statusElement.textContent =
            "περιμένω δεδομένα από το TagoIO…"

        requestInProgress = false
        return
    }


    // DISPLAY VALUES

    voltageElement.textContent =
        Number(voltageBody.result[0].value)

    powerElement.textContent =
        Number(powerBody.result[0].value)


    statusElement.textContent =
        "updated " + new Date().toLocaleTimeString()


    requestInProgress = false
}


setInterval(fetchLatestValues, 2000)

fetchLatestValues()
