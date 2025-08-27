-- Tabla de Clientes
CREATE TABLE Clientes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Telefono NVARCHAR(20),
    NumeroCliente NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100),
    FechaCreacion DATETIME DEFAULT GETDATE()
);