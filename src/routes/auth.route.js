import express from 'express'
import { forgotPasswordAuthController, loginAuthController, registerAuthController, requestAuthController, resendVerifyEmailController, resetPasswordAuthController, verifyEmailController } from '../controllers/auth.controller.js'

const authRoute = express.Router()

authRoute.get('/request', requestAuthController)
authRoute.post('/register', registerAuthController)
authRoute.get('/verify-email', verifyEmailController)
authRoute.post('/resend-verify-email', resendVerifyEmailController)
authRoute.post('/login', loginAuthController)
authRoute.post('/forgot-password', forgotPasswordAuthController)
authRoute.post('/reset-password', resetPasswordAuthController)

export default authRoute