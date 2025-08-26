// server.js
// API RESTful para manejar el catálogo de clientes con SQL Server usando ODBC
// Autor: Daniel Meza
// Fecha: 25/08/2025

// server.js
const express = require('express');
const odbc = require('odbc'); // Asegurarse de tener instalado el paquete odbc
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000; // Puerto donde correrá el servidor

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ====================
// SERVIR FRONTEND
// ====================
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ====================
// RUTAS DE LA API
// ====================

// Cadena de conexión ODBC
const connectionString = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=MEZADESKTOP\\SQLEXPRESS;DATABASE=ClientesDB;UID=sa;PWD=mezasql;TrustServerCertificate=yes;';

// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const connection = await odbc.connect(connectionString);
        const result = await connection.query(`
            SELECT 
                c.ID, c.Nombre, c.Telefono, c.NumeroCliente, c.Email,
                (SELECT d.ID, d.Calle, d.Colonia 
                 FROM Direcciones d 
                 WHERE d.ClienteID = c.ID 
                 FOR JSON PATH) as Direcciones
            FROM Clientes c
        `);

        const clientes = result.map(row => ({
            ID: row.ID,
            Nombre: row.Nombre,
            Telefono: row.Telefono,
            NumeroCliente: row.NumeroCliente,
            Email: row.Email,
            Direcciones: row.Direcciones ? JSON.parse(row.Direcciones) : []
        }));

        res.json(clientes);
        await connection.close();
    } catch (err) {
        console.error('Error al obtener clientes:', err);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Obtener un cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
    try {
        const connection = await odbc.connect(connectionString);
        const result = await connection.query(`
            SELECT 
                c.ID, c.Nombre, c.Telefono, c.NumeroCliente, c.Email,
                (SELECT d.ID, d.Calle, d.Colonia 
                 FROM Direcciones d 
                 WHERE d.ClienteID = c.ID 
                 FOR JSON PATH) as Direcciones
            FROM Clientes c
            WHERE c.ID = ${req.params.id}
        `);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const cliente = {
            ...result[0],
            Direcciones: result[0].Direcciones ? JSON.parse(result[0].Direcciones) : []
        };

        res.json(cliente);
        await connection.close();
    } catch (err) {
        console.error('Error al obtener cliente:', err);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

// Crear cliente
app.post('/api/clientes', async (req, res) => {
    const { nombre, telefono, numeroCliente, email, direcciones } = req.body;

    try {
        const connection = await odbc.connect(connectionString);

        const clienteResult = await connection.query(`
            INSERT INTO Clientes (Nombre, Telefono, NumeroCliente, Email)
            OUTPUT INSERTED.ID
            VALUES ('${nombre}', '${telefono || ''}', '${numeroCliente}', '${email || ''}')
        `);

        const clienteId = clienteResult[0].ID;

        if (direcciones && direcciones.length > 0) {
            for (const dir of direcciones) {
                await connection.query(`
                    INSERT INTO Direcciones (ClienteID, Calle, Colonia)
                    VALUES (${clienteId}, '${dir.calle}', '${dir.colonia}')
                `);
            }
        }

        res.status(201).json({ message: 'Cliente creado', id: clienteId });
        await connection.close();
    } catch (err) {
        console.error('Error al crear cliente:', err);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// Actualizar cliente
app.put('/api/clientes/:id', async (req, res) => {
    const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
    const id = req.params.id;

    try {
        const connection = await odbc.connect(connectionString);

        await connection.query(`
            UPDATE Clientes 
            SET Nombre = '${nombre}', 
                Telefono = '${telefono || ''}', 
                NumeroCliente = '${numeroCliente}', 
                Email = '${email || ''}'
            WHERE ID = ${id}
        `);

        await connection.query(`DELETE FROM Direcciones WHERE ClienteID = ${id}`);

        if (direcciones && direcciones.length > 0) {
            for (const dir of direcciones) {
                await connection.query(`
                    INSERT INTO Direcciones (ClienteID, Calle, Colonia)
                    VALUES (${id}, '${dir.calle}', '${dir.colonia}')
                `);
            }
        }

        res.json({ message: 'Cliente actualizado' });
        await connection.close();
    } catch (err) {
        console.error('Error al actualizar cliente:', err);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// Eliminar cliente
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const connection = await odbc.connect(connectionString);
        await connection.query(`DELETE FROM Clientes WHERE ID = ${req.params.id}`);
        res.json({ message: 'Cliente eliminado' });
        await connection.close();
    } catch (err) {
        console.error('Error al eliminar cliente:', err);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// ====================
// LEVANTAR SERVIDOR
// ====================
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
