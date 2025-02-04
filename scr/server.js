import ENVIROMENT from "../config/enviroment.js"
import express from express


const app = express()
const PORT = ENVIROMENT.PORT





app.lister(PORT, ()=>{
  console.log(`El servidor se esta ejecutando en http://localhost:${PORT}`)
})