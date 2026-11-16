// app.js se encarga de armar la app express que vamos a utilizar en el server solo de eso.

import express from "express"
import session from "express-session"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { config } from "./config.js"
import { errorHandler, requestContext } from "./middlewares/errorHandler.middleware.js"
import rutasMazos from "./routes/rutasMazos.js"
import rutasCartas from "./routes/rutasCartas.js"
import rutasImagenes from "./routes/rutasImagenes.js"
import rutasUsuarios from "./routes/rutasUsuarios.js"

const app = express()

// Registro de contexto e identificador unico por solicitud (X-Request-Id)
app.use(requestContext())

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { version } = require("../package.json")

app.get("/api/salud", (req, res) => {
  res.json({
    estado: "ok",
    version,
    entorno: config.env,
    uptime: Math.round(process.uptime()), // muestra los segundos
  })
})

// La ruta /test (Test Runner) solo está disponible al ejecutar el servidor en modo desarrollo (npm run dev)
app.use("/test", (req, res, next) => {
  const esDesarrollo = config.env === "development" || process.execArgv.includes("--watch")
  if (!esDesarrollo) {
    return res.status(404).send("Not Found")
  }
  if (req.path === "/" || req.path === "") {
    return res.redirect("/test/test-endpoints.html")
  }

  next()
})

app.use(express.static(path.join(__dirname, "..", "public")))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Detrás del proxy HTTPS en producción: confiar en X-Forwarded-Proto
if (config.production) app.set("trust proxy", 1)

// Definir la cookie usada por el server
app.use(session({
  name: "wiki.sid",
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: config.production,
    maxAge: 60 * 60 * 1000,
  },
}))

// Aca van los routes como normalmente
app.use("/api/mazos", rutasMazos)
app.use("/api/cartas", rutasCartas)
app.use("/api/imagenes", rutasImagenes)
app.use("/api/usuarios", rutasUsuarios)

// El errorHandler siempre tiene que estar al final para que express lo use bien
app.use(errorHandler)

export default app
