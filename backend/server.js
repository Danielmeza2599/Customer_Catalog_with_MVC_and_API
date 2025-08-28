// server.js
// API RESTful para manejar el catálogo de clientes con SQL Server usando ODBC
// Autor: Daniel Meza
// Fecha: 25/08/2025

// server.js - V2.1 -  VERSIÓN ADAPTADA PARA LOS STORED PROCEDURES ESPECÍFICOS
// VERSIÓN CORREGIDA
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

// Función auxiliar para convertir direcciones a XML
function direccionesToXML(direcciones) {
    if (!direcciones || direcciones.length === 0) {
        return null;
    }
    
    let xml = '<Direcciones>';
    direcciones.forEach(dir => {
        xml += `<Direccion><Calle>${escapeXML(dir.calle)}</Calle><Colonia>${escapeXML(dir.colonia)}</Colonia></Direccion>`;
    });
    xml += '</Direcciones>';
    
    return xml;
}

// Función para escapar caracteres especiales en XML
function escapeXML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

// Obtener todos los clientes - SP incluido
app.get('/api/clientes', async (req, res) => {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        const result = await connection.query(`EXEC ObtenerClientesConDirecciones`); // Ejecutar el stored procedure
        
        console.log('Resultado raw de ObtenerClientesConDirecciones:', result);// ayuda a ver qué está devolviendo SQL Server
        
        if (result.length === 0) {
            return res.json([]);
        }
        
        // El stored procedure devuelve JSON en la primera columna
        let clientes;
        try {
            // Buscar la columna que contiene el JSON
            const jsonColumn = Object.keys(result[0]).find(key => 
                typeof result[0][key] === 'string' && 
                result[0][key].trim().startsWith('[')
            );
            
            if (jsonColumn) {
                clientes = JSON.parse(result[0][jsonColumn]);
            } else {
                // Si no encontramos una columna JSON, intentar parsear el primer campo
                const firstValue = Object.values(result[0])[0];
                if (typeof firstValue === 'string') {
                    clientes = JSON.parse(firstValue);
                } else {
                    throw new Error('No se pudo encontrar el JSON en la respuesta');
                }
            }
        } catch (e) {
            console.error('Error parseando JSON de clientes:', e);
            console.error('Contenido recibido:', result[0]);
            return res.status(500).json({ error: 'Error procesando datos de clientes' });
        }
        
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

// Obtener un cliente por ID - SP incluido
app.get('/api/clientes/:id', async (req, res) => {
    let connection;
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        connection = await odbc.connect(connectionString);
        const result = await connection.query(`EXEC ObtenerClientePorID @id = ${id}`);// Ejecutar el stored procedure
        
        console.log('Resultado raw de ObtenerClientePorID:', result); // ayuda a ver qué está devolviendo SQL Server
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        // El stored procedure devuelve JSON en la primera columna
        let cliente;
        try {
            // Buscar la columna que contiene el JSON
            const jsonColumn = Object.keys(result[0]).find(key => 
                typeof result[0][key] === 'string' && 
                (result[0][key].trim().startsWith('[') || result[0][key].trim().startsWith('{'))
            );
            
            if (jsonColumn) {
                cliente = JSON.parse(result[0][jsonColumn]);
            } else {
                // Si no encontramos una columna JSON, intentar parsear el primer campo
                const firstValue = Object.values(result[0])[0];
                if (typeof firstValue === 'string') {
                    cliente = JSON.parse(firstValue);
                } else {
                    throw new Error('No se pudo encontrar el JSON en la respuesta');
                }
            }
        } catch (e) {
            console.error('Error parseando JSON del cliente:', e);
            console.error('Contenido recibido:', result[0]);
            return res.status(500).json({ error: 'Error procesando datos del cliente' });
        }
        
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

// Crear cliente
app.post('/api/clientes', async (req, res) => {
    let connection;
    try {
        const { nombre, telefono, numeroCliente, email, direcciones } = req.body;
        
        // Validaciones básicas
        if (!nombre || !numeroCliente) {
            return res.status(400).json({ error: 'Nombre y Número de Cliente son obligatorios' });
        }

        // Convertir direcciones a XML
        const direccionesXML = direccionesToXML(direcciones);
        
        connection = await odbc.connect(connectionString);
        
        // Construir la consulta con parámetros
        let query = `
            EXEC CrearClienteConDirecciones 
                @nombre = '${nombre.replace(/'/g, "''")}',
                @telefono = '${(telefono || '').replace(/'/g, "''")}',
                @numeroCliente = '${numeroCliente.replace(/'/g, "''")}',
                @email = '${(email || '').replace(/'/g, "''")}',
                @direcciones = ${direccionesXML ? `'${direccionesXML.replace(/'/g, "''")}'` : 'NULL'}
        `;
        
        const result = await connection.query(query);
        const nuevoClienteID = result[0].NuevoClienteID;

        res.status(201).json({ message: 'Cliente creado', id: nuevoClienteID });
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

// Actualizar cliente
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

        // Convertir direcciones a XML
        const direccionesXML = direccionesToXML(direcciones);
        
        connection = await odbc.connect(connectionString);
        
        // Construir la consulta con parámetros
        let query = `
            EXEC ActualizarClienteConDirecciones 
                @id = ${id},
                @nombre = '${nombre.replace(/'/g, "''")}',
                @telefono = '${(telefono || '').replace(/'/g, "''")}',
                @numeroCliente = '${numeroCliente.replace(/'/g, "''")}',
                @email = '${(email || '').replace(/'/g, "''")}',
                @direcciones = ${direccionesXML ? `'${direccionesXML.replace(/'/g, "''")}'` : 'NULL'}
        `;
        
        await connection.query(query);

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

// Eliminar cliente
app.delete('/api/clientes/:id', async (req, res) => {
    let connection;
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        connection = await odbc.connect(connectionString);
        await connection.query(`EXEC EliminarCliente @id = ${id}`);
        
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