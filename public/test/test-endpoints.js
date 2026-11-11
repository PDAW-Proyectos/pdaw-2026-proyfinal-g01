let stats = { total: 0, pass: 0, fail: 0, start: 0 }

function resetStats() {
  stats = { total: 0, pass: 0, fail: 0, start: performance.now() }
  updateStatsUI()
  document.getElementById("resultsList").innerHTML = ""
}

function updateStatsUI() {
  document.getElementById("statTotal").textContent = stats.total
  document.getElementById("statPass").textContent = stats.pass
  document.getElementById("statFail").textContent = stats.fail
  const elapsed = Math.round(performance.now() - (stats.start || performance.now()))
  document.getElementById("statTime").textContent = `${elapsed} ms`
}

async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include" // Manejo automático de cookies de sesión HTTP-only
  }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(endpoint, options)
  let data = null
  try {
    data = await res.json()
  } catch {
    data = { message: "Sin contenido JSON devuelto" }
  }
  return { status: res.status, data }
}

function renderTestCard({ name, method, endpoint, expectedStatus, actualStatus, passed, requestData, responseData }) {
  stats.total++
  if (passed) stats.pass++; else stats.fail++
  updateStatsUI()

  const methodClass = `method-${method.toLowerCase()}`
  const badgeClass = passed ? "badge-pass" : "badge-fail"
  const cardClass = passed ? "passed" : "failed"

  const card = document.createElement("div")
  card.className = `test-card ${cardClass}`

  const cardId = `test-body-${stats.total}`

  card.innerHTML = `
    <div class="test-header" onclick="document.getElementById('${cardId}').classList.toggle('d-none')">
      <div class="d-flex align-items-center gap-2">
        <span class="badge-method ${methodClass}">${method}</span>
        <span class="fw-bold text-dark">${name}</span>
        <small class="text-secondary ms-2">${endpoint}</small>
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="text-secondary small">Esperado: <strong>${expectedStatus}</strong> | Obtenido: <strong>${actualStatus}</strong></span>
        <span class="${badgeClass}">${passed ? "PASS" : "FAIL"}</span>
      </div>
    </div>
    <div id="${cardId}" class="test-body d-none">
      ${requestData ? `<div class="mb-3"><strong class="text-dark">Request Payload:</strong><pre>${JSON.stringify(requestData, null, 2)}</pre></div>` : ""}
      <div><strong class="text-dark">Response (${actualStatus}):</strong><pre>${JSON.stringify(responseData, null, 2)}</pre></div>
    </div>
  `

  document.getElementById("resultsList").appendChild(card)
}

// Suite: Cartas
async function testCartas() {
  // 1. Listar cartas
  const r1 = await apiRequest("/api/cartas", "GET")
  renderTestCard({
    name: "Listar cartas paginadas",
    method: "GET",
    endpoint: "/api/cartas",
    expectedStatus: 200,
    actualStatus: r1.status,
    passed: r1.status === 200 && Array.isArray(r1.data?.datos),
    responseData: r1.data
  })

  // 2. Filtrar cartas
  const r2 = await apiRequest("/api/cartas?name=Magician", "GET")
  renderTestCard({
    name: "Filtrar cartas por nombre",
    method: "GET",
    endpoint: "/api/cartas?name=Magician",
    expectedStatus: 200,
    actualStatus: r2.status,
    passed: r2.status === 200,
    responseData: r2.data
  })

  // 3. Carta inexistente (404)
  const r3 = await apiRequest("/api/cartas/999999999", "GET")
  renderTestCard({
    name: "Obtener carta inexistente (debe dar 404)",
    method: "GET",
    endpoint: "/api/cartas/999999999",
    expectedStatus: 404,
    actualStatus: r3.status,
    passed: r3.status === 404,
    responseData: r3.data
  })
}

// Suite: Auth & Usuarios
async function testAuth(usernameBase = `user_${Date.now()}`) {
  const credenciales = {
    nombre: "Usuario Test",
    username: usernameBase,
    contraseña: "password123"
  }

  // 1. Registro exitoso (201)
  const r1 = await apiRequest("/api/usuarios/registro", "POST", credenciales)
  renderTestCard({
    name: "Registro de usuario nuevo",
    method: "POST",
    endpoint: "/api/usuarios/registro",
    expectedStatus: 201,
    actualStatus: r1.status,
    passed: r1.status === 201,
    requestData: credenciales,
    responseData: r1.data
  })

  // 2. Registro duplicado (409)
  const r2 = await apiRequest("/api/usuarios/registro", "POST", credenciales)
  renderTestCard({
    name: "Registro con username duplicado (debe fallar)",
    method: "POST",
    endpoint: "/api/usuarios/registro",
    expectedStatus: 409,
    actualStatus: r2.status,
    passed: r2.status === 409,
    requestData: credenciales,
    responseData: r2.data
  })

  // 3. Login fallido (401)
  const r3 = await apiRequest("/api/usuarios/login", "POST", { username: usernameBase, contraseña: "clave_incorrecta" })
  renderTestCard({
    name: "Login con contraseña incorrecta (debe fallar)",
    method: "POST",
    endpoint: "/api/usuarios/login",
    expectedStatus: 401,
    actualStatus: r3.status,
    passed: r3.status === 401,
    responseData: r3.data
  })

  // 4. Login exitoso (200)
  const r4 = await apiRequest("/api/usuarios/login", "POST", { username: usernameBase, contraseña: "password123" })
  renderTestCard({
    name: "Login exitoso (guarda sesión wiki.sid)",
    method: "POST",
    endpoint: "/api/usuarios/login",
    expectedStatus: 200,
    actualStatus: r4.status,
    passed: r4.status === 200,
    responseData: r4.data
  })

  // 5. Intento de eliminar usuario sin ser admin (403)
  const r5 = await apiRequest(`/api/usuarios/${usernameBase}`, "DELETE")
  renderTestCard({
    name: "Eliminar usuario sin rol admin (debe dar 403)",
    method: "DELETE",
    endpoint: `/api/usuarios/${usernameBase}`,
    expectedStatus: 403,
    actualStatus: r5.status,
    passed: r5.status === 403,
    responseData: r5.data
  })

  return usernameBase
}

// Suite: Mazos
async function testMazos() {
  // 1. Crear mazo
  const datosMazo = { nombre: "Mazo Test Automatizado", mainDeck: [], extraDeck: [] }
  const r1 = await apiRequest("/api/mazos", "POST", datosMazo)
  const mazoId = r1.data?.id

  renderTestCard({
    name: "Crear mazo autenticado",
    method: "POST",
    endpoint: "/api/mazos",
    expectedStatus: 201,
    actualStatus: r1.status,
    passed: r1.status === 201 && Boolean(mazoId),
    requestData: datosMazo,
    responseData: r1.data
  })

  // 2. Listar mazos del usuario autenticado (sin query param username, usa la sesión)
  const r2 = await apiRequest("/api/mazos", "GET")
  renderTestCard({
    name: "Listar mazos del usuario autenticado",
    method: "GET",
    endpoint: "/api/mazos",
    expectedStatus: 200,
    actualStatus: r2.status,
    passed: r2.status === 200 && Array.isArray(r2.data?.datos),
    responseData: r2.data
  })

  // 3. Listar todos los mazos del sistema (?all=true)
  const r2All = await apiRequest("/api/mazos?all=true", "GET")
  renderTestCard({
    name: "Listar todos los mazos (?all=true)",
    method: "GET",
    endpoint: "/api/mazos?all=true",
    expectedStatus: 200,
    actualStatus: r2All.status,
    passed: r2All.status === 200,
    responseData: r2All.data
  })

  if (mazoId) {
    // 4. Modificar nombre del mazo
    const r3 = await apiRequest(`/api/mazos/${mazoId}`, "PATCH", { nombre: "Mazo Renombrado" })
    renderTestCard({
      name: "Actualizar mazo propio",
      method: "PATCH",
      endpoint: `/api/mazos/${mazoId}`,
      expectedStatus: 200,
      actualStatus: r3.status,
      passed: r3.status === 200,
      responseData: r3.data
    })

    // 5. Eliminar mazo (devuelve 204 No Content)
    const r4 = await apiRequest(`/api/mazos/${mazoId}`, "DELETE")
    renderTestCard({
      name: "Eliminar mazo propio",
      method: "DELETE",
      endpoint: `/api/mazos/${mazoId}`,
      expectedStatus: 204,
      actualStatus: r4.status,
      passed: r4.status === 204,
      responseData: r4.data
    })
  }
}

// Suite: Logout
async function testLogout() {
  // 1. Logout
  const r1 = await apiRequest("/api/usuarios/logout", "POST")
  renderTestCard({
    name: "Cerrar sesión (Logout)",
    method: "POST",
    endpoint: "/api/usuarios/logout",
    expectedStatus: 200,
    actualStatus: r1.status,
    passed: r1.status === 200,
    responseData: r1.data
  })

  // 2. Intento de crear mazo tras logout (401)
  const r2 = await apiRequest("/api/mazos", "POST", { nombre: "Mazo sin sesión" })
  renderTestCard({
    name: "Crear mazo tras logout (debe dar 401 Unauthorized)",
    method: "POST",
    endpoint: "/api/mazos",
    expectedStatus: 401,
    actualStatus: r2.status,
    passed: r2.status === 401,
    responseData: r2.data
  })
}

// Correr todo en secuencia
async function runAll() {
  resetStats()
  await testCartas()
  await testAuth()
  await testMazos()
  await testLogout()
}

document.getElementById("btnRunAll").addEventListener("click", runAll)
document.getElementById("btnRunCartas").addEventListener("click", async () => { resetStats(); await testCartas(); })
document.getElementById("btnRunAuth").addEventListener("click", async () => { resetStats(); await testAuth(); await testLogout(); })
document.getElementById("btnRunMazos").addEventListener("click", async () => { resetStats(); await testAuth(); await testMazos(); await testLogout(); })
document.getElementById("btnClear").addEventListener("click", resetStats)
