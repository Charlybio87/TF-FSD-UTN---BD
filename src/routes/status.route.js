//CONFIGURACION DEL ENRUTADOR DE STATUS

import express from 'express'
import ENVIROMENT from '../config/enviroment.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { postPingController, requestPingController } from '../controllers/status.controller.js'

const statusRoute = express.Router()

statusRoute.post('/ping',authMiddleware, postPingController)
statusRoute.get('/ping', requestPingController)

export default statusRoute