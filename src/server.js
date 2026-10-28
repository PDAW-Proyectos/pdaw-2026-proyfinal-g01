import express from "express"
import cartaRoutes from "./routes/cartaRoutes.js"

const app = express()
const PORT = 3000

app.use(express.json())

app.use("/api/cartas", cartaRoutes)

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`)
})