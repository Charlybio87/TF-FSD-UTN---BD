import nodemailer from 'nodemailer'
import ENVIROMENT from './enviroment.js'

/*
*  Email Service
*  ==============
*  This service is used to send emails to users
*  It uses the nodemailer library to send emails
*  It uses the enviroment file to get the email settings
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: ENVIROMENT.EMAIL_USER,
        pass: ENVIROMENT.EMAIL_PASS
    }
})

export default transporter