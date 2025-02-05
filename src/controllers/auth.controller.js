import User from "../models/user.model.js"

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

export const registerAuthController = async (req, res) =>{
  try {
    console.log(req.body)

    const {name, email, password} = req.body
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Name, email, and password are required.",
        ok: false
      })
    }
  } catch (error) {
    console.error(error)
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
        });
    }

    const user_found = await UserRepository.findUserByEmail(email)
    console.log(user_found)
    if (!user_found) {

        return res.json({
            ok: false,
            status: 404,
            message: "there is no user with this email",
        });
    }
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
    });
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