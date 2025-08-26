// server.js
// API RESTful para manejar el catálogo de clientes con SQL Server
// Autor: Daniel Meza
// Fecha: 25/08/2025

// backend/server.js
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5500; // Puerto donde correrá la API

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Configuración de la base de datos (ajustar segun la configuración del SQL Server)
const dbConfig = {
    server: '.\SQLEXPRESS', // Ajusta el nombre del servidor
    database: 'ClientesDB',
    user: 'sa',
    password: 'mezasql',
    port: 1433, // Puerto por defecto de SQL Server
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Conexión a la base de datos
let pool;
async function connectToDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Conectado a SQL Server');
    } catch (err) {
        console.error('Error conectando a la base de datos:', err);
    }
}

connectToDatabase();

// Rutas de la API
// Obtener todos los clientes con sus direcciones
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.request()
            .execute('ObtenerClientesConDirecciones');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener clientes:', err);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Obtener un cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .execute('ObtenerClientePorID');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener cliente:', err);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

// Crear un nuevo cliente con direcciones
app.post('/api/clientes', async (req, res) => {
    const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
    
    try {
        const request = pool.request();
        request.input('nombre', sql.NVarChar, nombre);
        request.input('telefono', sql.NVarChar, telefono || '');
        request.input('numeroCliente', sql.NVarChar, numeroCliente);
        request.input('email', sql.NVarChar, email || '');
        
        // Convertir direcciones a XML para pasarlas al stored procedure
        let direccionesXML = '<Direcciones>';
        if (direcciones && direcciones.length > 0) {
            direcciones.forEach(dir => {
                direccionesXML += `<Direccion><Calle>${dir.calle}</Calle><Colonia>${dir.colonia}</Colonia></Direccion>`;
            });
        }
        direccionesXML += '</Direcciones>';
        
        request.input('direcciones', sql.Xml, direccionesXML);
        
        const result = await request.execute('CrearClienteConDirecciones');
        res.status(201).json({ message: 'Cliente creado', id: result.recordset[0].NuevoClienteID });
    } catch (err) {
        console.error('Error al crear cliente:', err);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// Actualizar un cliente existente
app.put('/api/clientes/:id', async (req, res) => {
    const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
    const id = req.params.id;
    
    try {
        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('nombre', sql.NVarChar, nombre);
        request.input('telefono', sql.NVarChar, telefono || '');
        request.input('numeroCliente', sql.NVarChar, numeroCliente);
        request.input('email', sql.NVarChar, email || '');
        
        // Convertir direcciones a XML
        let direccionesXML = '<Direcciones>';
        if (direcciones && direcciones.length > 0) {
            direcciones.forEach(dir => {
                const dirId = dir.id || 0;
                direccionesXML += `<Direccion><ID>${dirId}</ID><Calle>${dir.calle}</Calle><Colonia>${dir.colonia}</Colonia></Direccion>`;
            });
        }
        direccionesXML += '</Direcciones>';
        
        request.input('direcciones', sql.Xml, direccionesXML);
        
        await request.execute('ActualizarClienteConDirecciones');
        res.json({ message: 'Cliente actualizado' });
    } catch (err) {
        console.error('Error al actualizar cliente:', err);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// Eliminar un cliente
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .execute('EliminarCliente');
        
        res.json({ message: 'Cliente eliminado' });
    } catch (err) {
        console.error('Error al eliminar cliente:', err);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});