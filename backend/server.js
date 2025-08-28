// server.js
// API RESTful para manejar el catálogo de clientes con SQL Server usando ODBC
// Autor: Daniel Meza
// Fecha: 25/08/2025

// server.js - VERSIÓN V2.1 CON STORED PROCEDURES
const express = require('express');
const odbc = require('odbc');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Habilitar CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../docs')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../docs/index.html'));
});

// Cadena de conexión ODBC
const connectionString = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=MEZADESKTOP\\SQLEXPRESS;DATABASE=ClientesDB;UID=sa;PWD=mezasql;TrustServerCertificate=yes;';

// 
 // API Clientes
//
// Obtener todos los clientes usando Stored Procedure
app.get('/api/clientes', async (req, res) => {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        const result = await connection.query(`EXEC ObtenerClientesConDirecciones`);
        
        // Parsear correctamente las direcciones
        const clientes = result.map(row => {
            let direcciones = [];
            try {
                if (row.Direcciones) {
                    direcciones = JSON.parse(row.Direcciones);
                    if (!Array.isArray(direcciones)) {
                        direcciones = [direcciones];
                    }
                }
            } catch (e) {
                console.error('Error parseando direcciones:', e);
                direcciones = [];
            }

            return {
                ID: row.ID,
                Nombre: row.Nombre,
                Telefono: row.Telefono,
                NumeroCliente: row.NumeroCliente,
                Email: row.Email,
                Direcciones: direcciones
            };
        });

        res.json(clientes);
    } catch (err) {
        console.error('Error al obtener clientes:', err);
        res.status(500).json({ error: 'Error al obtener clientes: ' + err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error('Error cerrando conexión:', e);
            }
        }
    }
});

//
// API Clientes por ID
//
// Obtener un cliente por ID usando Stored Procedure
app.get('/api/clientes/:id', async (req, res) => {
    let connection;
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        connection = await odbc.connect(connectionString);
        const result = await connection.query(`EXEC ObtenerClientePorID @ID = ${id}`);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // Parsear correctamente las direcciones
        let direcciones = [];
        try {
            if (result[0].Direcciones) {
                direcciones = JSON.parse(result[0].Direcciones);
                if (!Array.isArray(direcciones)) {
                    direcciones = [direcciones];
                }
            }
        } catch (e) {
            console.error('Error parseando direcciones:', e);
            direcciones = [];
        }

        const cliente = {
            ID: result[0].ID,
            Nombre: result[0].Nombre,
            Telefono: result[0].Telefono,
            NumeroCliente: result[0].NumeroCliente,
            Email: result[0].Email,
            Direcciones: direcciones
        };

        res.json(cliente);
    } catch (err) {
        console.error('Error al obtener cliente:', err);
        res.status(500).json({ error: 'Error al obtener cliente: ' + err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error('Error cerrando conexión:', e);
            }
        }
    }
});

//
// API Crear, Actualizar y Eliminar Clientes
//
// Crear cliente usando Stored Procedures
app.post('/api/clientes', async (req, res) => {
    let connection;
    try {
        const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
        
        // Validaciones básicas
        if (!nombre || !numeroCliente) {
            return res.status(400).json({ error: 'Nombre y Número de Cliente son obligatorios' });
        }

        connection = await odbc.connect(connectionString);

        // Insertar cliente usando Stored Procedure
        const clienteResult = await connection.query(`
            DECLARE @NewID INT;
            EXEC CrearClienteConDirecciones
                @Nombre = '${nombre.replace(/'/g, "''")}', 
                @Telefono = '${telefono || ''}', 
                @NumeroCliente = '${numeroCliente.replace(/'/g, "''")}', 
                @Email = '${email || ''}', 
                @NewID = @NewID OUTPUT;
            SELECT @NewID as ID;
        `);

        const clienteId = clienteResult[0].ID;

        // Insertar direcciones usando Stored Procedure
        if (direcciones && direcciones.length > 0) {
            for (const dir of direcciones) {
                if (dir.calle && dir.colonia) {
                    await connection.query(`
                        EXEC sp_InsertDireccion 
                            @ClienteID = ${clienteId}, 
                            @Calle = '${dir.calle.replace(/'/g, "''")}', 
                            @Colonia = '${dir.colonia.replace(/'/g, "''")}'
                    `);
                }
            }
        }

        res.status(201).json({ message: 'Cliente creado', id: clienteId });
    } catch (err) {
        console.error('Error al crear cliente:', err);
        res.status(500).json({ error: 'Error al crear cliente: ' + err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error('Error cerrando conexión:', e);
            }
        }
    }
});



// Actualizar cliente usando Stored Procedures
app.put('/api/clientes/:id', async (req, res) => {
    let connection;
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
        
        if (!nombre || !numeroCliente) {
            return res.status(400).json({ error: 'Nombre y Número de Cliente son obligatorios' });
        }

        connection = await odbc.connect(connectionString);

        // Actualizar cliente usando Stored Procedure
        await connection.query(`
            EXEC ActualizarClienteConDirecciones
                @ID = ${id},
                @Nombre = '${nombre.replace(/'/g, "''")}',
                @Telefono = '${telefono || ''}',
                @NumeroCliente = '${numeroCliente.replace(/'/g, "''")}',
                @Email = '${email || ''}'
        `);

        // Eliminar direcciones existentes
        await connection.query(`DELETE FROM Direcciones WHERE ClienteID = ${id}`);

        // Insertar nuevas direcciones
        if (direcciones && direcciones.length > 0) {
            for (const dir of direcciones) {
                if (dir.calle && dir.colonia) {
                    await connection.query(`
                        EXEC sp_InsertDireccion 
                            @ClienteID = ${id}, 
                            @Calle = '${dir.calle.replace(/'/g, "''")}', 
                            @Colonia = '${dir.colonia.replace(/'/g, "''")}'
                    `);
                }
            }
        }

        res.json({ message: 'Cliente actualizado' });
    } catch (err) {
        console.error('Error al actualizar cliente:', err);
        res.status(500).json({ error: 'Error al actualizar cliente: ' + err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error('Error cerrando conexión:', e);
            }
        }
    }
});

// Eliminar cliente usando Stored Procedure
app.delete('/api/clientes/:id', async (req, res) => {
    let connection;
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        connection = await odbc.connect(connectionString);
        await connection.query(`EXEC EliminarCliente @ID = ${id}`);
        
        res.json({ message: 'Cliente eliminado' });
    } catch (err) {
        console.error('Error al eliminar cliente:', err);
        res.status(500).json({ error: 'Error al eliminar cliente: ' + err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error('Error cerrando conexión:', e);
            }
        }
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`✅ Servidor ejecutándose en http://localhost:${port}`);
});