// ===== Configuración =====
const ENDPOINTS = [
    { name: "Estado general", url: "/api/salud", expectedStatus: 200 },
    { name: "Cartas", url: "/api/cartas", expectedStatus: 200 },
    { name: "Mazos populares", url: "/api/mazos/populares", expectedStatus: 200 },
]

const CHECK_INTERVALO_MS = 60000 // refresco automático cada 60 s
const MAX_HISTORIAL_CHEQUEOS = 60
const historialChequeos = ENDPOINTS.map(() => [])
let chequeoEnCurso = false

const grid = document.getElementById("endpointGrid")
const badge = document.getElementById("badgeGlobal")
const last = document.getElementById("lastCheck")
const statUp = document.getElementById("statUp")
const statDown = document.getElementById("statDown")
const statAvg = document.getElementById("statAvg")

function renderCards() {
    grid.innerHTML = ""
    for(let i=0; i < ENDPOINTS.length; i++){
        const card = document.createElement("div")
        card.className = 'endpoint-card'
        card.setAttribute("id", `ep-${i}`)
            const cardTop = document.createElement("div")
            cardTop.className = 'endpoint-top'
                const spanName = document.createElement("span")
                spanName.className = 'endpoint-name'
                spanName.textContent = `${ENDPOINTS[i].name}`
                const spanDot = document.createElement("span")
                spanDot.className = 'endpoint-dot'
                spanDot.setAttribute("id", `dot-${i}`)
            const divUrl = document.createElement("div")
            divUrl.className = 'endpoint-url'
            divUrl.textContent = `${ENDPOINTS[i].url || "URL no configurada"}`
            const divMeta = document.createElement("div")
            divMeta.className = 'endpoint-meta'
                const spanLatencia = document.createElement("span")
                spanLatencia.textContent = "Latencia: "
                    const bL = document.createElement("b")
                    bL.setAttribute("id", `lat-${i}`)
                    bL.textContent = "-"
                const spanUptime = document.createElement("span")
                spanUptime.textContent = "Disponibilidad obs: "
                    const bU = document.createElement("b")
                    bU.setAttribute("id", `upt-${i}`)
                    bU.textContent = "-"
            const divState = document.createElement("div")
            divState.className = 'endpoint-state pending'
            divState.setAttribute("id", `state-${i}`)
            divState.textContent = "Comprobando…"
        spanLatencia.appendChild(bL)
        spanUptime.appendChild(bU)
        divMeta.append(spanLatencia, spanUptime)
        cardTop.append(spanName, spanDot)
        card.append(cardTop, divUrl, divMeta, divState)
        grid.appendChild(card)
    }
}

async function checkEndpoint(ep) {
    if (!ep.url) {
        return { status: "warn", latency: null, detail: "URL no configurada" }
    }
    const started = performance.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
        const res = await fetch(ep.url, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store"
        })
        const latency = Math.round(performance.now() - started)
        if (res.status === ep.expectedStatus) {
            return { status: "ok", latency, detail: "" }
        } else if (res.status >= 500) {
            return { status: "error", latency, detail: `Error HTTP ${res.status}` }
        } else {
            return { status: "warn", latency, detail: `HTTP ${res.status}` }
        }
    } catch (err) {
        const latency = Math.round(performance.now() - started)
        const detail = err.name === "AbortError" ? "Tiempo de espera agotado" : "Sin conexión"
        return { status: "error", latency, detail }
    } finally {
        clearTimeout(timeout)
    }
}

function paint(i, result, disponibilidad) {
    document.getElementById(`dot-${i}`).className = `endpoint-dot ${result.status}`
    document.getElementById(`state-${i}`).textContent =
        result.status === "ok" ? "Operativo" :
        result.status === "warn" ? `Advertencia: ${result.detail}` : result.detail
    document.getElementById(`state-${i}`).className = `endpoint-state ${result.status}`
    document.getElementById(`lat-${i}`).textContent =
        result.latency !== null ? `${result.latency} ms` : "—"
    document.getElementById(`upt-${i}`).textContent = disponibilidad
        ? `${disponibilidad.porcentaje}% (${disponibilidad.muestras} ${disponibilidad.muestras === 1 ? "chequeo" : "chequeos"})`
        : "—"
}

async function checkAll() {
    if (chequeoEnCurso) return
    chequeoEnCurso = true
    try {
        const results = await Promise.all(ENDPOINTS.map(checkEndpoint))

        for (let i = 0; i < results.length; i++) {
            const historial = historialChequeos[i]
            historial.push(results[i].status === "ok")
            if (historial.length > MAX_HISTORIAL_CHEQUEOS) {
                historial.shift()
            }

            const exitosos = historial.filter(Boolean).length
            const disponibilidad = {
                porcentaje: Math.round((exitosos / historial.length) * 100),
                muestras: historial.length
            }
            paint(i, results[i], disponibilidad)
        }

        const up = results.filter(r => r.status === "ok").length
        const warn = results.filter(r => r.status === "warn").length
        const down = results.filter(r => r.status === "error").length
        const latencies = results.filter(r => r.status === "ok").map(r => r.latency)
        const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null

        statUp.textContent = `${up}/${results.length}`
        statDown.textContent = down
        statAvg.textContent = avg !== null ? `${avg} ms` : "—"

        if (down === 0 && warn === 0) {
            badge.className = "badge-global ok"
            badge.textContent = "TODO OPERATIVO"
        } else if (down > 0) {
            badge.className = "badge-global error"
            badge.textContent = "INTERRUPCIÓN DETECTADA"
        } else {
            badge.className = "badge-global warn"
            badge.textContent = "DEGRADADO"
        }

        const now = new Date()
        last.textContent = now.toLocaleTimeString("es-ES")
    } finally {
        chequeoEnCurso = false
    }
}

document.getElementById("btnRefresh").addEventListener("click", checkAll)

renderCards()
checkAll()
setInterval(checkAll, CHECK_INTERVALO_MS)