-- Eliminar cliente
CREATE PROCEDURE EliminarCliente
    @id INT
AS
BEGIN
    DELETE FROM Clientes WHERE ID = @id;
END;