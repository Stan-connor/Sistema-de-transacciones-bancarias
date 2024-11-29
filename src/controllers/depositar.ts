import { Request, Response } from 'express';
import connection from '../db/db'; // Conexión a la base de datos
import { RowDataPacket } from 'mysql2'; // Importar RowDataPacket

const depositar = (req: Request, res: Response): Response => {
  const { account_number, amount } = req.body;  // Obtener el número de cuenta y el monto desde el cuerpo de la solicitud

  if (!account_number || !amount || amount <= 0) {
    return res.status(400).json({ message: 'El número de cuenta y el monto a depositar son obligatorios y el monto debe ser mayor que 0.' });
  }

  // Primero, verificamos si la cuenta existe
  const query = 'SELECT * FROM accounts WHERE account_number = ?';
  connection.query(query, [account_number], (err, result) => {
    if (err) {
      console.error('Error al consultar la cuenta:', err);
      return res.status(500).json({ message: 'Error al consultar la cuenta.' });
    }

    // Verificamos que el resultado es un array de RowDataPacket
    const rows = result as RowDataPacket[];  // Tratamos el resultado como un array de RowDataPacket

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cuenta no encontrada.' });
    }

    const account = rows[0]; // Obtener la cuenta desde el resultado

    // Verificar que el objeto cuenta tiene la propiedad 'balance'
    if (account && account.balance !== undefined) {
      const newBalance = account.balance + amount;

      const updateQuery = 'UPDATE accounts SET balance = ? WHERE account_number = ?';
      connection.query(updateQuery, [newBalance, account_number], (err, updateResult) => {
        if (err) {
          console.error('Error al actualizar el saldo:', err);
          return res.status(500).json({ message: 'Error al actualizar el saldo.' });
        }

        return res.status(200).json({
          message: 'Depósito realizado con éxito.',
          account_number,
          amount_deposited: amount, // Añadimos el monto depositado a la respuesta
          new_balance: newBalance
        });
      });
    } else {
      return res.status(404).json({ message: 'El saldo de la cuenta no está disponible.' });
    }
  });

  return res;
};

export default depositar;
