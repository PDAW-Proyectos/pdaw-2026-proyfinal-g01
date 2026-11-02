import app from "./app.js"

// Declaracion del puerto
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un entero entre 1 y 65535.");
}

// Iniciación del server
const server = app.listen(port, () => {
  console.log(`Servidor escuchando en: http://localhost:${port}`);
});

// Error al iniciar el server
server.on("error", (error) => {
  console.error("Error al iniciar el servidor:", error);
  process.exit(1);
});
