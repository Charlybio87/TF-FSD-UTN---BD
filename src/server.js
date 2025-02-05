import express from 'express'
import ENVIROMENT from "./config/enviroment.js"
import statusRoute from './routes/status.route.js'
import productRoute from './routes/product.route.js'
import authRoute from './routes/auth.route.js'
import mongoose from './config/dbMongoose.config.js'

const app = express()
const PORT = ENVIROMENT.PORT

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
app.use('/api/status', statusRoute)
app.use('/api/products', productRoute)
app.use('/api/auth', authRoute)




app.listen(PORT, ()=>{
  console.log(`El servidor se esta ejecutando en http://localhost:${PORT}`)
})
