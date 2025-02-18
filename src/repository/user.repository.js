import pool from "../config/mysql.config.js"
// import User from "../models/user.model.js"

// class UserRepository{
//     async createUser ({username, email, password, verificationToken}){
//         const nuevo_usuario = new User({
//             username,
//             email, 
//             password,
//             verificationToken,
//             modifiedAt: null
//         })
//         return await nuevo_usuario.save()
//     }  

//     async findUserByEmail (email){
//         return await User.findOne({email: email})
//     }

//     async findById(id){
//         return await User.findById(id)
//     }

//     async verifyUser( user_id ){
//         const user = await this.findById(user_id)
//         user.verified = true
//         user.save()
//     }

// }

// export default new UserRepository()

class UserRepository{
    
    async createUser({username, email, password, role, verificationToken}){
        const queryStr = `
        INSERT INTO USERS (username,email,password,role,verificationToken) 
        VALUES( ?, ?, ?, ?, ? )
        `
        const [result] = await pool.execute(
            queryStr,
            [username, email, password, role, verificationToken]
        )
        return{
            _id: result.insertId,
            username,
            email,
            role
        }
    }
    async findUserByEmail (email){
        const queryStr = `SELECT * FROM USERS WHERE email = ?`
        const [result] = await pool.execute(queryStr, [email])
        return result[0] || null
    }

    async findById(id){
        const queryStr = `SELECT * FROM USERS WHERE _id = ?`
        const [result] = await pool.execute(queryStr, [id])
        return result[0] || null
    }

    async verifyUser( user_id ){
        const queryStr = `UPDATE USERS SET verified = 1 WHERE _id = ?`
        await pool.execute(queryStr, [user_id])
    }

}

export default new UserRepository()