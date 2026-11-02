// app.js se encarga de armar la app express que vamos a utilizar en el server solo de eso.

import express from "express"
import session from "express-session"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { errorHandler } from "./middlewares/errorHandler.js"
import rutasMazos from "./routes/rutasMazos.js"
import rutasUsuarios from "./routes/rutasUsuarios.js"

const app = express()

// como en el archivo server.js de el proyecto anterior inicio los middlewares
const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, "..", "public")))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
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
app.use("/api/usuarios", rutasUsuarios)

// El errorHandler siempre tiene que estar al final para que express lo use bien
app.use(errorHandler)

export default app
