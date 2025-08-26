// server.js
// API RESTful para manejar el catálogo de clientes con SQL Server
// Autor: Daniel Meza
// Fecha: 25/08/2025

// backend/server.js
// server.js - VERSIÓN CORREGIDA
const express = require('express');
const odbc = require('odbc'); // Usando odbc en lugar de mssql
const bodyParser = require('body-parser');
const app = express();
const port = 8001;  // Puerto del servidor

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de conexión ODBC
const connectionString = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=MEZADESKTOP\\SQLEXPRESS;DATABASE=ClientesDB;UID=sa;PWD=mezasql;TrustServerCertificate=yes;';

// Obtener todos los clientes con sus direcciones
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
        
        // Convertir direcciones de JSON string a objeto
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

// Crear un nuevo cliente con direcciones
app.post('/api/clientes', async (req, res) => {
    const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
    
    try {
        const connection = await odbc.connect(connectionString);
        
        // Insertar cliente
        const clienteResult = await connection.query(`
            INSERT INTO Clientes (Nombre, Telefono, NumeroCliente, Email)
            OUTPUT INSERTED.ID
            VALUES ('${nombre}', '${telefono || ''}', '${numeroCliente}', '${email || ''}')
        `);
        
        const clienteId = clienteResult[0].ID;
        
        // Insertar direcciones si existen
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

// Actualizar un cliente existente
app.put('/api/clientes/:id', async (req, res) => {
    const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
    const id = req.params.id;
    
    try {
        const connection = await odbc.connect(connectionString);
        
        // Actualizar cliente
        await connection.query(`
            UPDATE Clientes 
            SET Nombre = '${nombre}', 
                Telefono = '${telefono || ''}', 
                NumeroCliente = '${numeroCliente}', 
                Email = '${email || ''}'
            WHERE ID = ${id}
        `);
        
        // Eliminar direcciones existentes
        await connection.query(`DELETE FROM Direcciones WHERE ClienteID = ${id}`);
        
        // Insertar nuevas direcciones
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

// Eliminar un cliente
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

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
    console.log('✅ Conexión a SQL Server configurada correctamente');
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
    console.log('✅ Conexión a SQL Server configurada correctamente'); //Mostrar mensaje de éxito en consola
});