import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_DATABASE as string,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión: ', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL.');
});

export default connection;
