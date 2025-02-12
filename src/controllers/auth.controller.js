import jwt from "jsonwebtoken"
import userRepository from "../repository/user.repository.js"
import User from "../models/user.model.js"
import ENVIROMENT from "../config/enviroment.js"
import { sendMail } from "../utils/mail.util.js"
import bcrypt from 'bcrypt'


export const requestAuthController = async (req, res) =>{
  try {
    res.json({
      status: 200,
      message: "Request OK!",
      ok:true
    })
  } catch (error) {
    console.error(error)
    res.json({
      status: 500,
      message: "Internal Server Error",
      ok: false,
    })
  }
}

//Mejorar la Escalabilidad
const QUERY = {
  VERIFICATION_TOKEN: 'verification_token'
}

//Buscar por email
const findUserByEmail = async(email)=>{
  const userFound = await User.findOne({email: email})
  return userFound
}

const createUser = async ({username, email, password, verificationToken}) =>{
  const nuevo_usuario = new User({
    username,
    email, 
    password,
    verificationToken
  })
  return nuevo_usuario.save()
}


export const registerAuthController = async (req, res) =>{
  try {
    console.log(req.body)
    const {username, email, password} = req.body

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Name, email, and password are required.",
        ok: false
      })
    }
    // Check if user already exists
    const user_found = await findUserByEmail(email)
    if (user_found) {
      return res.json({
        status: 400,
        message: "Email user already exists",
        ok: false
      })
    }

    const verificationToken = jwt.sign({email}, ENVIROMENT.SECRET_KEY_JWT, {expiresIn: '1d'})

    await sendMail({
      to: email, // se envia email a quien se registra
      subject: 'Verifica tu mail para Baristacafé',
      html: `
      <h1>Verifica tu mail para Baristacafé</h1>
      <p>Para verificar tu cuenta, haz click en el siguiente enlace: 
        <a href='http://localhost:${ENVIROMENT.PORT}/api/auth/verify-email?${QUERY.VERIFICATION_TOKEN}=${verificationToken}'>
          Verificar email
        </a>
      </p>
      <p>Si no has solicitado la verificación de tu cuenta, ignora este mensaje
      </p>
      <p>Atentamente, Baristacafé</p>
      `
    })

    // Complejidad para encriptar contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Create a new user
    const new_user = await createUser({
      username: username, 
      email, 
      password: password_hash,
      verificationToken
    })
    res.json({
      status: 201,
      message: "User registered successfully",
      ok: true,
      data: {

      }
    })
  } catch (error) {
    console.error(error)
    res.json({
      status: 500,
      message: "Internal Server Error",
      ok: false
    })
  }
}

export const verifyEmailController = async (req,res) =>{
  // try {
  //   const {[QUERY.VERIFICATION_TOKEN]:verification_token} = req.query
  //   if(!verification_token){
  //     return res.send(`
  //       <h1>Falta el token de verificacion!</h1>
  //       <p>Status: 400</p>
  //       `
  //     )
  //   }
  //   //Verifica el TOKEN (lo decodifico)
  //   const payload = jwt.verify(verification_token,ENVIROMENT.SECRET_KEY_JWT)
  //   const user_to_verify = await findUserByEmail(payload.email)
  //   if(!user_to_verify){
  //     return res.send(`
  //       <h1>El usuario no existe!</h1>
  //       <p>Status: 404</p>
  //       `)
  //   }
  //   // Comparamos si son distintos el verif del usuario con el verif que recibimos
  //   if(user_to_verify.verificationToken !== verification_token){
  //     return res.send(`
  //       <h1>El token de verificacion no coincide!</h1>
  //       <p>Status: 400</p>
  //     `)
  //   }
  //   // Si todo es correcto, actualizamos el usuario del MongoDB
  //   user_to_verify.verified = true
  //   await user_to_verify.save()
  //   return res.send(`
  //     <h1>Usuario verificado con exito!</h1>
  //     <a href='${process.env.URL_FRONTEND}'>login aqui</a>
  //     `
  //   )
  // }
  try{
    const {[QUERY.VERIFICATION_TOKEN]: verification_token} = req.query
    if(!verification_token){
      return res.redirect(`${ENVIROMENT.URL_FRONTEND}/error?error=REQUEST_EMAIL_VERIFY_TOKEN`)
    }

    const payload = jwt.verify(verification_token, ENVIROMENT.SECRET_KEY_JWT)

    const user_to_verify = await findUserByEmail(payload.email)
    if(!user_to_verify){
      return res.redirect(`${ENVIROMENT.URL_FRONTEND}/error?error=REQUEST_EMAIL_VERIFY_TOKEN`)
    }
    if(user_to_verify.verificationToken !== verification_token){
        return res.redirect(`${ENVIROMENT.URL_FRONTEND}/error?error=RESEND_EMAIL_VERIFY_TOKEN`)
    }
    user_to_verify.verified = true
    await user_to_verify.save()
    return res.redirect(`${ENVIROMENT.URL_FRONTEND}/login?verified=true`)
  }
  catch (error){
    console.log(error)
    res.json({
      status: 500,
      message: "Internal Server Error",
      ok: false
    })
  }
}

export const resendVerifyEmailController = async (req, res) => {
  try {
    const { email } = req.body
    const user = await findUserByEmail(email)
    if(!user){
      return res.json({
        status: 404,
        message: "User not found",
        ok: false
      })
    }
    const verificationToken = jwt.sign({email}, ENVIROMENT.SECRET_KEY_JWT, {expiresIn: '1d'})
    console.log()
    // Actualizar el token de verificación en el usuario
    user.verificationToken = verificationToken; // Asignar el nuevo token
    await user.save(); // Guardar los cambios en la base de datos

    await sendMail({
      to: email, // se envia email a quien se registra
      subject: 'Reenvio de verificacion de tu mail para Baristacafé',
      html: `
      <h1>Verifica tu mail para Baristacafé</h1>
      <p>Para verificar tu cuenta, haz click en el siguiente enlace: 
        <a href='http://localhost:${ENVIROMENT.PORT}/api/auth/verify-email?${QUERY.VERIFICATION_TOKEN}=${verificationToken}'>
          Verificar email
        </a>
      </p>
      <p>Si no has solicitado la verificación de tu cuenta, ignora este mensaje
      </p>
      <p>Atentamente, Baristacafé</p>
      `
    })
    return res.json({
      status: 200,
      message: "Email de verificación reenviado con éxito",
      ok: true,
      data: {
      }
    })
  } catch (error) {
    console.log(error)
    res.json({
      status: 500,
      message: "Internal Server Error",
      ok: false
    })
  }
}


export const loginAuthController = async (req, res) => {
  try {
    console.log(req.body)

    const { email, password } = req.body;
    const errors = {
        email: null,
        password: null,
    };

    if (!email || !(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email))) {
        errors.email = "You must enter a valid value for email";
    }

    if (!password) {
        errors.password = "You must enter a password";
    }

    let hayErrores = false;
    for (let error in errors) {
        if (errors[error]) {
            hayErrores = true;
        }
    }

    if (hayErrores) {

        return res.json({
            message: "Errors exist!",
            ok: false,
            status: 400, //bad request
            errors: errors,
        })
    }

    // busqueda del usuario por email
    const user_found = await findUserByEmail(email)

    if (!user_found) {
        return res.json({
            ok: false,
            status: 404,
            message: "there is no user with this email",
        })
    }
    // comparacion entre la contrasena del usuario con  el hash encriptado
    const is_same_password = await bcrypt.compare(password, user_found.password)
    if (!is_same_password) {
        return res.json({
            ok: false,
            status: 400,
            message: "Wrong password",
        });
    }

    //Quiero transformar al user a un token
    const user_info =  {
        id: user_found._id,
        name: user_found.name,
        email: user_found.email,
    }

    const access_token = jwt.sign(user_info, ENVIROMENT.SECRET_KEY_JWT)

    return res.json({
        ok: true,
        status: 200,
        message: "Logged in",
        data: {
            user_info: {
                id: user_found._id,
                name: user_found.name,
                email: user_found.email,
            },
            access_token: access_token
        },
    })
  }
  catch(error){
      console.error(error)
      return res.json({
          ok:false,
          message: "Internal server error",
          status: 500,
      })
  }
}
export const forgotPasswordAuthController = async (req, res) =>{
  try{
      console.log(req.body)
      const {email} = req.body
      const user_found = await User.findOne({email})
      if(!user_found){
          return res.json({
              ok: false,
              status: 404,
              message: 'User not found'
          })
      }
      else{
          const reset_token = jwt.sign({email}, ENVIROMENT.SECRET_KEY_JWT, {expiresIn: '1d'})
          const reset_url = `${ENVIROMENT.URL_FRONTEND}/reset-password?reset_token=${reset_token}`
          await sendMail({
              to: email,
              subject: 'Restablecer contraseña',
              html: `
                  <h1>Restablecer contraseña</h1>
                  <p>Haz click en el enlace para restablecer tu contraseña</p>
                  <a href='${reset_url}'>Restablecer contraseña</a>
              `
          })
          return res.json({
              ok: true,
              status: 200,
              message: 'Email sent'
          })
      }
  }
  catch(error){
      console.error(error)
      return res.json({
          ok:false,
          message: "Internal server error",
          status: 500,
      })
  }
} 

export const resetPasswordAuthController = async (req, res) =>{
  try{
      const {reset_token} = req.query
      const {password} = req.body

      const {email} = jwt.verify(reset_token, ENVIROMENT.SECRET_KEY_JWT)
      const user_found = await User.findOne({email})
      const password_hash = await bcrypt.hash(password, 10)

      user_found.password = password_hash
      await user_found.save()
      return res.json({
          ok: true,
          status: 200, 
          message: 'Password changed'
      })
  }
  catch(error){
      console.error(error)
      return res.json({
          ok:false,
          message: "Internal server error",
          status: 500,
      })
  }
}
