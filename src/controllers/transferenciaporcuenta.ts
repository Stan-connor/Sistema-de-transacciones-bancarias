import { Request, Response } from 'express';
import connection from '../db/db'; // Conexión a la base de datos
import { RowDataPacket } from 'mysql2'; // Importar RowDataPacket

const transferir = (req: Request, res: Response): Response => {
  const { source_account_number, destination_account_number, amount } = req.body;  // Obtener los datos del cuerpo de la solicitud

  if (!source_account_number || !destination_account_number || !amount || amount <= 0) {
    return res.status(400).json({ message: 'El número de cuenta origen, número de cuenta destino y el monto son obligatorios y el monto debe ser mayor que 0.' });
  }

  // Verificar que las cuentas existen
  const query = 'SELECT * FROM accounts WHERE account_number = ?';
  connection.query(query, [source_account_number], (err, result) => {
    if (err) {
      console.error('Error al consultar la cuenta origen:', err);
      return res.status(500).json({ message: 'Error al consultar la cuenta origen.' });
    }

    const rows = result as RowDataPacket[];

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cuenta origen no encontrada.' });
    }

    const sourceAccount = rows[0];

    // Verificar si la cuenta de destino existe
    connection.query(query, [destination_account_number], (err, result) => {
      if (err) {
        console.error('Error al consultar la cuenta destino:', err);
        return res.status(500).json({ message: 'Error al consultar la cuenta destino.' });
      }

      const destinationRows = result as RowDataPacket[];

      if (destinationRows.length === 0) {
        return res.status(404).json({ message: 'Cuenta destino no encontrada.' });
      }

      const destinationAccount = destinationRows[0];

      // Verificar si la cuenta de origen tiene suficiente saldo
      if (sourceAccount.balance < amount) {
        return res.status(400).json({ message: 'Saldo insuficiente en la cuenta origen.' });
      }

      // Realizamos la transferencia (restamos del saldo de la cuenta origen y sumamos a la cuenta destino)
      const newSourceBalance = sourceAccount.balance - amount;
      const newDestinationBalance = destinationAccount.balance + amount;

      const updateSourceQuery = 'UPDATE accounts SET balance = ? WHERE account_number = ?';
      const updateDestinationQuery = 'UPDATE accounts SET balance = ? WHERE account_number = ?';

      // Actualizar el saldo en ambas cuentas dentro de una transacción
      connection.beginTransaction((err) => {
        if (err) {
          console.error('Error al iniciar transacción:', err);
          return res.status(500).json({ message: 'Error al iniciar transacción.' });
        }

        connection.query(updateSourceQuery, [newSourceBalance, source_account_number], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              console.error('Error al actualizar cuenta origen:', err);
              return res.status(500).json({ message: 'Error al actualizar cuenta origen.' });
            });
          }

          connection.query(updateDestinationQuery, [newDestinationBalance, destination_account_number], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                console.error('Error al actualizar cuenta destino:', err);
                return res.status(500).json({ message: 'Error al actualizar cuenta destino.' });
              });
            }

            // Confirmar la transacción
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  console.error('Error al confirmar transacción:', err);
                  return res.status(500).json({ message: 'Error al confirmar la transacción.' });
                });
              }

              // Responder con éxito
              return res.status(200).json({
                message: 'Transferencia realizada con éxito.',
                source_account_number,
                destination_account_number,
                amount_transferred: amount,
                new_source_balance: newSourceBalance,
                new_destination_balance: newDestinationBalance,
              });
            });
          });
        });
      });
    });
  });

  return res;
};

export default transferir;
