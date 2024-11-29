import { Request, Response } from 'express';
import connection from '../db/db'; // Conexión a la base de datos
import { RowDataPacket, ResultSetHeader } from 'mysql2'; // Importar tipos de MySQL2

// Función para generar un pocket_number aleatorio entre 000 y 100
const generarPocketNumberAleatorio = (): string => {
  const randomNumber = Math.floor(Math.random() * 101); // Genera un número entre 0 y 100
  return `P${randomNumber.toString().padStart(3, '0')}`; // Devuelve el número con formato PXXX
};

const crearBolsillo = (req: Request, res: Response): Response => {
  const { account_number, name, initial_balance, pocket_number } = req.body; // Obtener datos del cuerpo de la solicitud

  const parsedBalance = parseInt(initial_balance, 10);

  if (!account_number || !name || isNaN(parsedBalance) || parsedBalance <= 0) {
    return res.status(400).json({
      message: 'El número de cuenta, el nombre del bolsillo y el saldo inicial son obligatorios. El saldo inicial debe ser un número entero mayor que 0.'
    });
  }

  // Verificar si la cuenta principal existe
  const queryAccount = 'SELECT * FROM accounts WHERE account_number = ?';
  connection.query(queryAccount, [account_number], (err, result) => {
    if (err) {
      console.error('Error al consultar la cuenta principal:', err);
      return res.status(500).json({ message: 'Error al consultar la cuenta principal.' });
    }

    const rowsAccount = result as RowDataPacket[];
    if (rowsAccount.length === 0) {
      return res.status(404).json({ message: 'Cuenta principal no encontrada.' });
    }

    const account = rowsAccount[0]; // Obtener la cuenta principal

    // Verificar si la cuenta tiene suficiente saldo para crear el bolsillo
    if (account.balance < parsedBalance) {
      return res.status(400).json({ message: 'Saldo insuficiente en la cuenta principal para crear el bolsillo.' });
    }

    // Si el pocket_number no se proporciona, se genera uno aleatorio
    let pocketNumber = pocket_number || generarPocketNumberAleatorio();

    // Verificar si el pocket_number ya existe para esta cuenta
    const queryPocket = 'SELECT * FROM pockets WHERE account_number = ? AND pocket_number = ?';
    connection.query(queryPocket, [account_number, pocketNumber], (err, result) => {
      if (err) {
        console.error('Error al consultar el bolsillo:', err);
        return res.status(500).json({ message: 'Error al consultar el bolsillo.' });
      }

      // Verificar si el resultado es un array (lo que ocurre con SELECT)
      if (Array.isArray(result)) {
        if (result.length > 0) {
          // Si ya existe el pocket_number para esta cuenta, generar uno nuevo aleatorio
          pocketNumber = generarPocketNumberAleatorio();

          // Verificar nuevamente si el nuevo pocket_number ya existe
          connection.query(queryPocket, [account_number, pocketNumber], (err, result) => {
            if (err) {
              console.error('Error al consultar el bolsillo:', err);
              return res.status(500).json({ message: 'Error al consultar el bolsillo.' });
            }

            if (Array.isArray(result) && result.length === 0) {
              // Si el nuevo pocket_number tampoco existe, se crea el bolsillo
              const insertQuery = 'INSERT INTO pockets (account_number, pocket_number, name, balance) VALUES (?, ?, ?, ?)';
              connection.query(insertQuery, [account_number, pocketNumber, name, parsedBalance], (err, insertResult: ResultSetHeader) => {
                if (err) {
                  console.error('Error al crear el bolsillo:', err);
                  return res.status(500).json({ message: 'Error al crear el bolsillo.' });
                }

                const pocketId = insertResult.insertId;

                // Actualizar el saldo de la cuenta principal
                const newBalance = account.balance - parsedBalance;
                const updateQuery = 'UPDATE accounts SET balance = ? WHERE account_number = ?';
                connection.query(updateQuery, [newBalance, account_number], (err, updateResult) => {
                  if (err) {
                    console.error('Error al actualizar el saldo de la cuenta principal:', err);
                    return res.status(500).json({ message: 'Error al actualizar el saldo de la cuenta principal.' });
                  }

                  return res.status(201).json({
                    message: 'Bolsillo creado con éxito.',
                    pocket_number: pocketNumber,
                    account_number,
                    name,
                    initial_balance: parsedBalance,
                    new_balance: newBalance
                  });
                });
              });
            } else {
              // Si aún existe el nuevo pocket_number, enviar error
              return res.status(400).json({ message: 'No se puede crear el bolsillo porque el número de bolsillo ya existe en esta cuenta.' });
            }
          });
        } else {
          // Si no existe el pocket_number, se crea el bolsillo
          const insertQuery = 'INSERT INTO pockets (account_number, pocket_number, name, balance) VALUES (?, ?, ?, ?)';
          connection.query(insertQuery, [account_number, pocketNumber, name, parsedBalance], (err, insertResult: ResultSetHeader) => {
            if (err) {
              console.error('Error al crear el bolsillo:', err);
              return res.status(500).json({ message: 'Error al crear el bolsillo.' });
            }

            const pocketId = insertResult.insertId;

            // Actualizar el saldo de la cuenta principal
            const newBalance = account.balance - parsedBalance;
            const updateQuery = 'UPDATE accounts SET balance = ? WHERE account_number = ?';
            connection.query(updateQuery, [newBalance, account_number], (err, updateResult) => {
              if (err) {
                console.error('Error al actualizar el saldo de la cuenta principal:', err);
                return res.status(500).json({ message: 'Error al actualizar el saldo de la cuenta principal.' });
              }

              return res.status(201).json({
                message: 'Bolsillo creado con éxito.',
                pocket_number: pocketNumber,
                account_number,
                name,
                initial_balance: parsedBalance,
                new_balance: newBalance
              });
            });
          });
        }
      } else {
        // Si el resultado no es un array, significa que no se trató de una consulta SELECT
        return res.status(500).json({ message: 'Error en la consulta de bolsillo. El resultado no es un array.' });
      }
    });
  });

  return res;
};

export default crearBolsillo;
