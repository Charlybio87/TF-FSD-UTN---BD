import mongoose from "mongoose"

// ESQUEMA DEL USUARIO CON SUS REQUERIMIENTOS
const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    verified: {type: Boolean, default: false},
    verificationToken: {type: String},
    createdAt: {type: Date, default: Date.now},
    role: {type: String, default: 'user',required: true},
    activo: {type: Boolean, default: true}
})

// MODELO USER
const User = mongoose.model('User', userSchema) 

// const nuevo_usuario = new User({
//   name: 'charly',
//   email: 'charly@gmail.com',
//   password: '123456',
//   emailVerified: false,
//   verficationToken: 'tokenX',
//   activo: true
// })
// nuevo_usuario.save()

export default User