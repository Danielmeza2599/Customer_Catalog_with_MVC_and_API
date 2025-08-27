-- Store Precudires
-- Crear cliente con direcciones
CREATE PROCEDURE CrearClienteConDirecciones
    @nombre NVARCHAR(100),
    @telefono NVARCHAR(20),
    @numeroCliente NVARCHAR(50),
    @email NVARCHAR(100),
    @direcciones XML
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insertar cliente
        INSERT INTO Clientes (Nombre, Telefono, NumeroCliente, Email)
        VALUES (@nombre, @telefono, @numeroCliente, @email);
        
        DECLARE @nuevoClienteID INT = SCOPE_IDENTITY();
        
        -- Insertar direcciones si existen
        IF @direcciones IS NOT NULL
        BEGIN
            INSERT INTO Direcciones (ClienteID, Calle, Colonia)
            SELECT 
                @nuevoClienteID,
                T.C.value('(Calle)[1]', 'NVARCHAR(200)'),
                T.C.value('(Colonia)[1]', 'NVARCHAR(100)')
            FROM @direcciones.nodes('/Direcciones/Direccion') AS T(C);
        END
        
        SELECT @nuevoClienteID AS NuevoClienteID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;