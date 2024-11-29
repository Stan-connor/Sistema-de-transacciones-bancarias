import { Request, Response } from 'express';
import db from '../db/db';

function consultarCuenta(req: Request, res: Response): void {
  const { account_number } = req.params;

  const query = 'SELECT * FROM accounts WHERE account_number = ?';

  db.query(query, [account_number], (err: any, results: any[]) => {
    if (err) {
      return res.status(400).send('Error al consultar la cuenta');
    }

    if (results.length === 0) {
      return res.status(404).send('Cuenta no encontrada');
    }

    const account = results[0];
    res.status(200).send({
      account_number: account.account_number,
      owner_name: account.owner_name,
      balance: account.balance
    });
  });
}

export default consultarCuenta;
