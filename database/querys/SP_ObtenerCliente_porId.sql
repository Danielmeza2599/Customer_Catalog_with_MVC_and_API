-- Stored Procedures
-- Obtener un cliente por ID
CREATE PROCEDURE ObtenerClientePorID
    @id INT
AS
BEGIN
    SELECT 
        c.ID,
        c.Nombre,
        c.Telefono,
        c.NumeroCliente,
        c.Email,
        (SELECT 
            d.ID,
            d.Calle,
            d.Colonia
         FROM Direcciones d
         WHERE d.ClienteID = c.ID
         FOR JSON PATH) AS Direcciones
    FROM Clientes c
    WHERE c.ID = @id
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END;