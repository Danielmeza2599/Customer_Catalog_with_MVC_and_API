-- Actualizar cliente con direcciones
CREATE PROCEDURE ActualizarClienteConDirecciones
    @id INT,
    @nombre NVARCHAR(100),
    @telefono NVARCHAR(20),
    @numeroCliente NVARCHAR(50),
    @email NVARCHAR(100),
    @direcciones XML
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Actualizar cliente
        UPDATE Clientes 
        SET 
            Nombre = @nombre,
            Telefono = @telefono,
            NumeroCliente = @numeroCliente,
            Email = @email
        WHERE ID = @id;
        
        -- Eliminar direcciones existentes
        DELETE FROM Direcciones WHERE ClienteID = @id;
        
        -- Insertar nuevas direcciones si existen
        IF @direcciones IS NOT NULL
        BEGIN
            INSERT INTO Direcciones (ClienteID, Calle, Colonia)
            SELECT 
                @id,
                T.C.value('(Calle)[1]', 'NVARCHAR(200)'),
                T.C.value('(Colonia)[1]', 'NVARCHAR(100)')
            FROM @direcciones.nodes('/Direcciones/Direccion') AS T(C);
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;