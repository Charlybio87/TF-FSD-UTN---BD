import ENVIROMENT from "../config/enviroment.js"
import transporter from "../config/mail.config.js"

export const sendMail = async ({to,subject,html}) =>{
    try{
        const data = await transporter.sendMail( 
            // {
            //     from: ENVIROMENT.EMAIL_USER,
            //     to: 'charliemaildev@gmail.com',
            //     subject: 'PRUEBA DE PROJECT FINAL',
            //     html: `
            //     <h1> Probando envio de email </h1>
            //     <p>Logramos enviar un mail desde el back</p>
            //     <a href='https://www.vercel.com'>Link de prueba</a>`
            // }
            {
                from: ENVIROMENT.EMAIL_USER,
                to,
                subject,
                html
            }
        )
        return data
    }
    catch(error){
        console.error('ERROR al enviar mail:', error)
    }
}