

export const postPingController = (req, res) => {
    console.log(
        'Consulta recibida en /api/status/ping de tipo POST. Body:', req.body
    )

    console.log(req.user)
    res.json({
        status: 200, 
        message: 'Pong', 
        ok: true
    })
}
export const requestPingController = (req,res) => {
    try {
        res.json({
            status: 200,
            message: "Request OK!",
            ok:true
        })
        } 
    catch (error) {
        console.error(error)
        res.json({
            status: 500,
            message: "Internal Server Error",
            ok: false,
        })
    }
}

