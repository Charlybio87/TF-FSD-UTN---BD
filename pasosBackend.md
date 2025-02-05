

Backend Framework: Node.js con Express. Rutas: Crear rutas para manejo de usuarios: Autenticación: Login y registro. Protección: Rutas privadas protegidas mediante JWT. Una ruta protegida que devuelva información específica del usuario autenticado. Middlewares: Implementar middlewares para validaciones (como datos de formularios) y protección de rutas. Seguridad: Manejo de contraseñas con bcrypt para el registro y login. Uso de tokens JWT para autenticar usuarios. Configurar variables sensibles (como claves JWT) mediante variables de entorno. Mails: Enviar un correo electrónico. Por ejemplo: Confirmación de registro. Recuperación de contraseña (opcional). Base de datos: Usar MongoDB o Mysql para persistir datos.
# type: commonjs

## **1. Configuración del Proyecto**

### **Instalar Node.js y Express** 

```bash
mkdir backend-practica
cd backend-practica
npm init -y
npm install express dotenv mongoose bcryptjs jsonwebtoken cors nodemailer
npm install --save-dev nodemon
```

- `dotenv`: Manejo de variables de entorno.
- `mongoose` o `mysql2`: Para conexión a MongoDB o MySQL.
- `bcryptjs`: Para cifrar contraseñas.
- `jsonwebtoken`: Para autenticación con JWT.
- `nodemailer`: Para envío de correos.
- `cors`: Para permitir solicitudes desde el frontend.
- `nodemon`: Para desarrollo con autorecarga.

### **Configurar el archivo `.env`**

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/miapp
JWT_SECRET=supersecreto
EMAIL_USER=micorreo@example.com
EMAIL_PASS=mipassword
```

------

## **2. Crear el Servidor con Express**

```js
// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a la base de datos
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Conectado"))
    .catch(err => console.error(err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
```

------

## **3. Crear Modelos (Usuarios)**

```js
// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});

module.exports = mongoose.model('User', UserSchema);
```

------

## **4. Rutas de Autenticación**

```js
// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error en el registro" });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Error en el login" });
    }
});

module.exports = router;
```

------

## **5. Middleware de Autenticación**

```js
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: "Acceso denegado" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: "Token inválido" });
    }
};
```

------

## **6. Rutas Protegidas**

```js
// routes/userRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = express.Router();

// Ruta protegida - información del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo usuario" });
    }
});

module.exports = router;
```

------

## **7. Validaciones de Datos**

```js
// middleware/validateMiddleware.js
const { check, validationResult } = require('express-validator');

exports.validateRegister = [
    check('name').not().isEmpty().withMessage('El nombre es obligatorio'),
    check('email').isEmail().withMessage('Correo inválido'),
    check('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];
```

Aplicarlo en la ruta de registro:

```js
const { validateRegister } = require('../middleware/validateMiddleware');
router.post('/register', validateRegister, async (req, res) => { ... });
```

------

## **8. Envío de Correos (Confirmación de Registro)**

```js
// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, text) => {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
};

module.exports = sendEmail;
```

En el registro de usuario, enviar el correo:

```js
const sendEmail = require('../utils/emailService');

router.post('/register', validateRegister, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        await sendEmail(email, "Registro exitoso", `Bienvenido, ${name}!`);
        
        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error en el registro" });
    }
});
```

------

## **9. Pruebas y Ejecución**

Para correr el servidor:

```bash
npm start
```

Si usas `nodemon`, cambia el script en `package.json`:

```json
"scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
}
```

Luego ejecuta:

```bash
npm run dev
```

------

### **Resumen de Funcionalidades**

✅ Autenticación: Registro y Login con bcrypt y JWT.
✅ Rutas Protegidas: Middleware para restringir acceso.
✅ Base de Datos: MongoDB para persistencia.
✅ Validaciones: Middleware para validar datos.
✅ Seguridad: Manejo de variables sensibles.
✅ Correo Electrónico: Notificación de registro.

# type: module - con mongoose

### **1. Configuración del entorno**

Antes de comenzar, instala las dependencias necesarias con:

```bash
npm init -y
npm install express dotenv bcryptjs jsonwebtoken mongoose nodemailer cors morgan
npm install --save-dev nodemon
```

- `express`: Framework para manejar rutas y peticiones.
- `dotenv`: Para manejar variables de entorno.
- `bcryptjs`: Para encriptar contraseñas.
- `jsonwebtoken`: Para autenticación con JWT.
- `mongoose` o `mysql2`: Para conectarse a MongoDB o MySQL.
- `nodemailer`: Para enviar correos electrónicos.
- `cors`: Para manejo de políticas CORS.
- `morgan`: Para logs de las peticiones HTTP.
- `nodemon`: Para reiniciar el servidor automáticamente en desarrollo.

------

### **2. Estructura del Proyecto**

```bash
/backend
│── node_modules/
│── src/
│   ├── config/
│   │   ├── db.js         # Configuración de la base de datos
│   │   ├── mailer.js     # Configuración de correos
│   ├── controllers/
│   │   ├── authController.js  # Controlador de autenticación
│   ├── middlewares/
│   │   ├── authMiddleware.js   # Middleware de autenticación
│   │   ├── validateMiddleware.js  # Middleware de validación
│   ├── models/
│   │   ├── User.js       # Modelo de usuario
│   ├── routes/
│   │   ├── authRoutes.js  # Rutas de autenticación
│   ├── server.js         # Archivo principal
│── .env                  # Variables de entorno
│── package.json
│── README.md
```

------

### **3. Configuración del Servidor**

En `server.js`:

```js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Rutas
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
```

------

### **4. Conexión con la Base de Datos**

En `config/db.js`:

```js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB conectado");
  } catch (error) {
    console.error("Error de conexión a MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
```

En `.env`:

```js
PORT=5000
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/miBase
JWT_SECRET=clave_secreta_super_segura
EMAIL_USER=tuemail@gmail.com
EMAIL_PASS=tucontraseña
```

------

### **5. Modelo de Usuario**

En `models/User.js`:

```js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.model("User", userSchema);
```

------

### **6. Controlador de Autenticación**

En `controllers/authController.js`:

```js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "../config/mailer.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "El usuario ya existe" });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Enviar correo de confirmación
    sendEmail(email, "Bienvenido", "Gracias por registrarte");

    res.status(201).json({ message: "Usuario registrado" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

    // Crear token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};
```

------

### **7. Middleware de Autenticación**

En `middlewares/authMiddleware.js`:

```js
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Acceso denegado" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Token inválido" });
  }
};

export default authMiddleware;
```

------

### **8. Rutas de Autenticación**

En `routes/authRoutes.js`:

```js
import express from "express";
import { register, login } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida", user: req.user });
});

export default router;
```

------

### **9. Configuración de Correos**

En `config/mailer.js`:

```js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
};

export default sendEmail;
```

------

Este backend cumple con la consigna:
✅ Login y registro con autenticación JWT
✅ Protección de rutas con middleware
✅ Envío de correos electrónicos
✅ Conexión con MongoDB
✅ Uso de bcrypt para encriptación de contraseñas

# type: module - con mysql

### **1. Instalar dependencias necesarias**

Ejecuta el siguiente comando para instalar MySQL y otras dependencias:

```bash
npm install express dotenv bcryptjs jsonwebtoken mysql2 nodemailer cors morgan
npm install --save-dev nodemon
```

------

### **2. Configurar la Base de Datos (MySQL)**

En `config/db.js`, establece la conexión con MySQL:

```js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
```

------

**Archivo `.env`**:

```ini
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña
DB_NAME=mi_base
JWT_SECRET=clave_secreta_super_segura
EMAIL_USER=tuemail@gmail.com
EMAIL_PASS=tucontraseña
```

------

### **3. Crear la Tabla en MySQL**

Ejecuta este script en tu base de datos MySQL:

```mysql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

------

### **4. Modelo de Usuario (Usando MySQL)**

En `models/User.js`, define las funciones para interactuar con MySQL:

```js
import pool from "../config/db.js";

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0]; // Devuelve el usuario encontrado o undefined
};

export const createUser = async (name, email, hashedPassword) => {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword]
  );
  return result.insertId;
};
```

------

### **5. Controlador de Autenticación**

En `controllers/authController.js`:

```js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from "../models/User.js";
import sendEmail from "../config/mailer.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "El usuario ya existe" });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario en la BD
    const userId = await createUser(name, email, hashedPassword);

    // Enviar correo de confirmación
    sendEmail(email, "Bienvenido", "Gracias por registrarte");

    res.status(201).json({ message: "Usuario registrado", userId });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

    // Crear token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};
```

------

### **6. Middleware de Autenticación**

En `middlewares/authMiddleware.js`:

```js
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Acceso denegado" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Token inválido" });
  }
};

export default authMiddleware;
```

------

### **7. Rutas de Autenticación**

En `routes/authRoutes.js`:

```js
import express from "express";
import { register, login } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida", user: req.user });
});

export default router;
```

------

### **8. Configuración de Correos**

En `config/mailer.js`:

```js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
};

export default sendEmail;
```

------

### **9. Configuración del Servidor**

En `server.js`:

```js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Rutas
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
```

### ✅ **Resumen**

✔ **MySQL** en lugar de MongoDB
✔ **Autenticación con JWT**
✔ **Protección de rutas** con middleware
✔ **Envío de correos electrónicos** con Nodemailer
✔ **Hash de contraseñas** con bcrypt

Ahora el backend usa **MySQL** en lugar de **MongoDB**, manteniendo la misma funcionalidad. 🚀
