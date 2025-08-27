# test_connection.py
import pyodbc
import sys

def test_connection():
    # Configuración de la conexión
    server = 'MEZADESKTOP\SQLEXPRESS'  # Ej: 'localhost', '192.168.1.100', 'nombre_instancia'
    database = 'ClientesDB'
    username = 'sa'
    password = 'mezasql'
    
    try:
        # Cadena de conexión
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        
        # Intentar conexión
        print("Intentando conectar a SQL Server...")
        conn = pyodbc.connect(connection_string)
        
        # Crear cursor y ejecutar consulta simple
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()
        
        print("✅ Conexión exitosa!")
        print(f"Versión de SQL Server: {version[0]}")
        
        # Cerrar conexión
        cursor.close()
        conn.close()
        return True
        
    except pyodbc.Error as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    test_connection()