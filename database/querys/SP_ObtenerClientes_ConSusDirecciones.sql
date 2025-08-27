-- Stored Procedures

-- Obtener todos los clientes con sus direcciones
CREATE PROCEDURE ObtenerClientesConDirecciones
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
    FOR JSON PATH;
END;
