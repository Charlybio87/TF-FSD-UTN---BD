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

const createUser = async ({username, email, password, role, verificationToken}) =>{
  const nuevo_usuario = new User({
    username,
    email, 
    password,
    role,
    verificationToken,
    modifiedAt: null
  })
  return nuevo_usuario.save()
}


export const registerAuthController = async (req, res) =>{
  try {
    console.log(req.body)
    const {username, email, password, role} = req.body

    // Input validation
    if (!username || !email || !password || !role) {
      return res.json({
        status: 400,
        message: "Name, email, role and password are required.",
        ok: false
      })
    }
    // Check if user already exists
    // const user_found = await findUserByEmail(email)
    const user_found = await userRepository.findUserByEmail(email)

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
        <a href='${ENVIROMENT.URL_BACKEND}/api/auth/verify-email?${QUERY.VERIFICATION_TOKEN}=${verificationToken}'>
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
    const new_user = await userRepository.createUser({username, email, password: password_hash, role, verificationToken})
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
  try{
    const {[QUERY.VERIFICATION_TOKEN]: verification_token} = req.query
    if(!verification_token){
      return res.redirect(`${ENVIROMENT.URL_FRONTEND}/error?error=REQUEST_EMAIL_VERIFY_TOKEN`)
    }
    const payload = jwt.verify(verification_token, ENVIROMENT.SECRET_KEY_JWT)
    const user_to_verify = await userRepository.findUserByEmail(payload.email)
    console.log(user_to_verify)
    if(!user_to_verify){
      return res.redirect(`${ENVIROMENT.URL_FRONTEND}/error?error=REQUEST_EMAIL_VERIFY_TOKEN`)
    }
    if(user_to_verify.verificationToken !== verification_token){
        return res.redirect(`${ENVIROMENT.URL_FRONTEND}/error?error=RESEND_EMAIL_VERIFY_TOKEN`)
    }

    // Update user verification status
    await userRepository.verifyUser(user_to_verify._id)
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
        <a href='${ENVIROMENT.URL_BACKEND}/api/auth/verify-email?${QUERY.VERIFICATION_TOKEN}=${verificationToken}'>
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

    const { email, password, role } = req.body;
    const errors = {
        email: null,
        password: null,
        role: null
    };

    if (!email || !(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email))) {
        errors.email = "You must enter a valid value for email";
    }

    if (!password) {
        errors.password = "You must enter a password";
    }

    if (!role) {
      errors.role = "You must enter a role";
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
        username: user_found.username,
        role: user_found.role,
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
                username: user_found.username,
                role: user_found.role,
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
      const user_found = await userRepository.findUserByEmail({email})
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
      const user_found = await userRepository.findUserByEmail({email})
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
