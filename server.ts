import express, { Request, Response } from 'express';
import consultarCuenta from './src/controllers/consultarcuenta'; // Controlador para consultar la cuenta
import crearCuenta from './src/controllers/crearcuenta'; // Controlador para crear una cuenta
import depositar from './src/controllers/depositar'; // Controlador para realizar el depósito
import transferir from './src/controllers/transferenciaporcuenta'; // Controlador para realizar la transferencia
import crearBolsillo from './src/controllers/crearbolsillo'; // Controlador para crear un bolsillo
import transferirABolsillo from './src/controllers/transferirabolsillo'; // Controlador para transferir a un bolsillo
import consultarBolsillos from './src/controllers/consultarbolsillo'; // Controlador para consultar todos los bolsillos
import './src/db/db'; // Importa la conexión a la base de datos

const app = express();
const port = 3000;

app.use(express.json());

// Ruta para consultar una cuenta por número
app.get('/api/account/:account_number', (req: Request, res: Response) => {
  consultarCuenta(req, res); // Llamamos al controlador para consultar la cuenta
});

// Ruta para crear una nueva cuenta
app.post('/api/account', (req: Request, res: Response) => {
  crearCuenta(req, res); // Llamamos al controlador para crear la cuenta
});

// Ruta para realizar un depósito en una cuenta
app.post('/api/accounts/:account_number/deposit', (req: Request, res: Response) => {
  depositar(req, res); // Llamamos al controlador para realizar el depósito
});

// Ruta para realizar una transferencia entre cuentas
app.post('/api/accounts/transfer', (req: Request, res: Response) => {
  transferir(req, res); // Llamamos al controlador para realizar la transferencia
});

// Ruta para crear un bolsillo (subcuenta)
app.post('/api/pockets', (req: Request, res: Response) => {
  crearBolsillo(req, res); // Llamamos al controlador para crear el bolsillo
});

// Ruta para realizar una transferencia de una cuenta a un bolsillo
app.post('/api/accounts/transfer-to-pocket', (req: Request, res: Response) => {
  transferirABolsillo(req, res); // Llamamos al controlador para transferir a un bolsillo
});

// Ruta para consultar todos los bolsillos de una cuenta
app.get('/api/pockets/consult', (req: Request, res: Response) => {
  consultarBolsillos(req, res); // Llamamos al controlador para consultar todos los bolsillos
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
