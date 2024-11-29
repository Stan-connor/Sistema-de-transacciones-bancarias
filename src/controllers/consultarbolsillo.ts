import { Request, Response } from 'express';
import connection from '../db/db'; // Conexión a la base de datos
import { RowDataPacket } from 'mysql2';

const consultarBolsillos = (req: Request, res: Response): Response => {
  const { account_number } = req.body;  // Obtener account_number desde el body

  if (!account_number) {
    return res.status(400).json({ message: 'El número de cuenta es obligatorio.' });
  }

  // Consultar todos los bolsillos asociados a la cuenta
  const query = 'SELECT * FROM pockets WHERE account_number = ?';
  connection.query(query, [account_number], (err, result) => {
    if (err) {
      console.error('Error al consultar los bolsillos:', err);
      return res.status(500).json({ message: 'Error al consultar los bolsillos.' });
    }

    const rows = result as RowDataPacket[];
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron bolsillos para la cuenta proporcionada.' });
    }

    return res.status(200).json({
      account_number,
      pockets: rows.map(row => ({
        pocket_number: row.pocket_number,
        name: row.name,
        balance: row.balance,
      })),
    });
  });

  return res;
};

export default consultarBolsillos;
