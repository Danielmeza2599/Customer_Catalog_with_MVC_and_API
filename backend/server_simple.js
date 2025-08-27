// server_simple.js - SERVER NUEVO Y LIMPIO
const express = require('express');
const odbc = require('odbc');
const bodyParser = require('body-parser');
const app = express();
const port = 8081;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: '✅ Server funciona!' });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor en http://localhost:${port}`);
});