// test-connection.js
// test_connection.js - PRUEBA ESTAS OPCIONES
const sql = require('mssql');

// Probar estas configuraciones UNA POR UNA:
const configOptions = [
    {
        server: 'localhost\\SQLEXPRESS',
        database: 'master',
        user: 'sa',
        password: 'mezasql',
        options: { encrypt: false, trustServerCertificate: true }
    },
    {
        server: '.\\SQLEXPRESS',
        database: 'master',
        user: 'sa',
        password: 'mezasql',
        options: { encrypt: false, trustServerCertificate: true }
    },
    {
        server: '127.0.0.1\\SQLEXPRESS',
        database: 'master',
        user: 'sa',
        password: 'mezasql',
        options: { encrypt: false, trustServerCertificate: true }
    }
];

async function testConnection(config) {
    try {
        console.log(`🔌 Probando: ${config.server}...`);
        await sql.connect(config);
        console.log('✅ CONEXIÓN EXITOSA!');
        const result = await sql.query`SELECT @@VERSION as version`;
        console.log('Versión:', result.recordset[0].version);
        await sql.close();
        return true;
    } catch (err) {
        console.log('❌ Error:', err.message);
        return false;
    }
}

async function testAll() {
    for (let i = 0; i < configOptions.length; i++) {
        console.log(`\n--- Opción ${i + 1} ---`);
        const success = await testConnection(configOptions[i]);
        if (success) {
            console.log(`\n🎉 CONFIGURACIÓN GANADORA:`);
            console.log(JSON.stringify(configOptions[i], null, 2));
            return;
        }
    }
    console.log('\n😞 Ninguna funcionó. Probemos algo más...');
}

testAll();