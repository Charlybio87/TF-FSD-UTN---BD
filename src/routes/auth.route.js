import express from 'express'
import { loginAuthController, registerAuthController, requestAuthController } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const authRoute = express.Router()

authRoute.get('/request', requestAuthController)
authRoute.post('/register', registerAuthController)
authRoute.post('/login', authMiddleware, loginAuthController)

export default authRoute