import { Request, Response } from 'express';
import connection from '../db/db'; // Conexión a la base de datos
import { RowDataPacket } from 'mysql2';

const transferirABolsillo = (req: Request, res: Response): void => {
  const { account_number, pocket_number, amount } = req.body;

  const parsedAmount = parseInt(amount, 10);

  if (!account_number || !pocket_number || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({
      message: 'El número de cuenta, el número de bolsillo y la cantidad son obligatorios. La cantidad debe ser un número mayor que 0.',
    });
    return;
  }

  connection.beginTransaction(err => {
    if (err) {
      console.error('Error al iniciar la transacción:', err);
      res.status(500).json({ message: 'Error interno del servidor.' });
      return;
    }

    // Verificar si la cuenta principal existe y tiene saldo suficiente
    const queryAccount = 'SELECT * FROM accounts WHERE account_number = ?';
    connection.query(queryAccount, [account_number], (err, result) => {
      if (err) {
        return connection.rollback(() => {
          console.error('Error al consultar la cuenta principal:', err);
          res.status(500).json({ message: 'Error al consultar la cuenta principal.' });
        });
      }

      const rowsAccount = result as RowDataPacket[];
      if (rowsAccount.length === 0) {
        return connection.rollback(() => {
          res.status(404).json({ message: 'Cuenta principal no encontrada.' });
        });
      }

      const account = rowsAccount[0];

      if (account.balance < parsedAmount) {
        return connection.rollback(() => {
          res.status(400).json({ message: 'Saldo insuficiente en la cuenta principal.' });
        });
      }

      // Verificar si el bolsillo existe
      const queryPocket = 'SELECT * FROM pockets WHERE account_number = ? AND pocket_number = ?';
      connection.query(queryPocket, [account_number, pocket_number], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            console.error('Error al consultar el bolsillo:', err);
            res.status(500).json({ message: 'Error al consultar el bolsillo.' });
          });
        }

        const rowsPocket = result as RowDataPacket[];
        if (rowsPocket.length === 0) {
          return connection.rollback(() => {
            res.status(404).json({ message: 'Bolsillo no encontrado.' });
          });
        }

        const pocket = rowsPocket[0];

        // Actualizar el saldo del bolsillo
        const newPocketBalance = pocket.balance + parsedAmount;
        const updatePocketQuery = 'UPDATE pockets SET balance = ? WHERE pocket_number = ?';
        connection.query(updatePocketQuery, [newPocketBalance, pocket_number], err => {
          if (err) {
            return connection.rollback(() => {
              console.error('Error al actualizar el bolsillo:', err);
              res.status(500).json({ message: 'Error al actualizar el bolsillo.' });
            });
          }

          // Actualizar el saldo de la cuenta principal
          const newAccountBalance = account.balance - parsedAmount;
          const updateAccountQuery = 'UPDATE accounts SET balance = ? WHERE account_number = ?';
          connection.query(updateAccountQuery, [newAccountBalance, account_number], err => {
            if (err) {
              return connection.rollback(() => {
                console.error('Error al actualizar la cuenta principal:', err);
                res.status(500).json({ message: 'Error al actualizar la cuenta principal.' });
              });
            }

            // Confirmar la transacción
            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  console.error('Error al confirmar la transacción:', err);
                  res.status(500).json({ message: 'Error interno del servidor.' });
                });
              }

              res.status(200).json({
                message: 'Transferencia realizada con éxito.',
                new_account_balance: newAccountBalance,
                new_pocket_balance: newPocketBalance,
              });
            });
          });
        });
      });
    });
  });
};

export default transferirABolsillo;
