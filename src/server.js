import express from 'express'
import ENVIROMENT from "./config/enviroment.js"
import statusRoute from './routes/status.route.js'
import productRoute from './routes/product.route.js'
import authRoute from './routes/auth.route.js'
import mongoose from './config/dbMongoose.config.js'
import User from './models/user.model.js'
import { sendMail } from './utils/mail.util.js'
import cors from 'cors'

const app = express()
const PORT = ENVIROMENT.PORT

// Cross-Origin Resource Sharing
// Se permite recibir consultas del origin
app.use(
  cors({
    origin: 'http://localhost:5173', // Direccion de dominio del frontend
  })
)

// middleware recibe JSON
app.use(express.json())

// Conocer si el servidor recibe consulta
/*app.get('/ping', (req, res) =>{
  res.json({
    status: 200,
    message: 'pong',
    ok: true
  })
})*/

//Delegamos el flujo de consultas a /api/... al enrutador de status/products/...
app.use('/api/auth', authRoute)
app.use('/api/products', productRoute)
app.use('/api/status', statusRoute)




app.listen(PORT, ()=>{
  console.log(`El servidor se esta ejecutando en http://localhost:${PORT}`)
})

// sendMail(
// to: 'charliemaildev@gmail.com',
// subject: 'PRUEBA DE PROJECT FINAL',
// html: `
//     <h1> Probando envio de email </h1>
//     <p>Logramos enviar un mail desde el back</p>
//     <a href='https://www.vercel.com'>Link de prueba</a>` 
// ) //invocado