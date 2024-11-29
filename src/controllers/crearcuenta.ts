import { Request, Response } from 'express';
import connection from '../db/db';

const crearCuenta = (req: Request, res: Response) => {
  const { owner_name, balance } = req.body;

  // Verificación de parámetros
  if (!owner_name || balance === undefined) {
    return res.status(400).json({ message: 'Faltan datos: nombre del dueño o saldo inicial.' });
  }

  // Generación de un número de cuenta aleatorio
  const account_number = Math.floor(Math.random() * 1000000000);

  // Consulta SQL para insertar la nueva cuenta
  const query = 'INSERT INTO accounts (account_number, owner_name, balance) VALUES (?, ?, ?)';
  connection.query(query, [account_number, owner_name, balance], (err, result) => {
    if (err) {
      console.error('Error al crear la cuenta:', err);
      return res.status(500).json({ message: 'Error al crear la cuenta.' });
    }

    // Respuesta al cliente con los datos de la cuenta creada
    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      account_number,
      owner_name,
      balance
    });
  });
};

export default crearCuenta;
