

Backend Framework: Node.js con Express. Rutas: Crear rutas para manejo de usuarios: Autenticación: Login y registro. Protección: Rutas privadas protegidas mediante JWT. Una ruta protegida que devuelva información específica del usuario autenticado. Middlewares: Implementar middlewares para validaciones (como datos de formularios) y protección de rutas. Seguridad: Manejo de contraseñas con bcrypt para el registro y login. Uso de tokens JWT para autenticar usuarios. Configurar variables sensibles (como claves JWT) mediante variables de entorno. Mails: Enviar un correo electrónico. Por ejemplo: Confirmación de registro. Recuperación de contraseña (opcional). Base de datos: Usar MongoDB o Mysql para persistir datos.

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