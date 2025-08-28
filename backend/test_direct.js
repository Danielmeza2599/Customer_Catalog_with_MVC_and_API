// test_direct.js
// test_odbc.js - 
const odbc = require('odbc');

async function testConnection() {
    try {
        const connectionString = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=MEZADESKTOP\\SQLEXPRESS;DATABASE=master;UID=sa;PWD=mezasql;TrustServerCertificate=yes;';
        
        console.log('🔌 Conectando con ODBC...');
        const connection = await odbc.connect(connectionString);
        console.log('✅ CONEXIÓN EXITOSA CON ODBC!');
        
        const result = await connection.query('SELECT @@VERSION as version');
        console.log('Versión:', result[0].version);
        
        await connection.close();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testConnection();