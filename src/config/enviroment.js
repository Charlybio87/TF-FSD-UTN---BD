import dotenv from 'dotenv'

dotenv.config()

const ENVIROMENT = {
  PORT: process.env.PORT || 3000,
  SECRET_KEY_JWT: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  URL_FRONTEND: process.env.URL_FRONTEND, //en local podrian usar localhost
  MYSQL: {
    HOST: process.env.MYSQL_HOST,
    DB_NAME: process.env.MYSQL_DB_NAME,
    USERNAME: process.env.MYSQL_USERNAME, 
    PASSWORD:process.env.MYSQL_PASSWORD
  }

}

export default ENVIROMENT