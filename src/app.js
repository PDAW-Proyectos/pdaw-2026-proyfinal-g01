// app.js se encarga de armar la app express que vamos a utilizar en el server solo de eso.

import express from "express"
import path from "node:path"
import { fileURLToPath } from "node:url"
import rutasMazos from "./routes/rutasMazos.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import usuarioRouter from "./routes/usuario.routes.js"

const app = express()
import session from "express-session"
//const session = require('express-session')

// como en el archivo server.js de el proyecto anterior inicio los middlewares
const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, "..", "public")))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Definir la cookie usada por el server
app.use(session({
    name: 'wiki.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
    },
}))

// Aca van los routes como normalmente
app.use("/api/mazos", rutasMazos)
app.use("/api/usuarios", usuarioRouter)

// El errorHandler siempre tiene que estar al final para que express lo use bien
app.use(errorHandler)

export default app
