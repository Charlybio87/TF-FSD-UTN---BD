import ProductRepository from "../repository/product.repository.js"

export const requestProductController = async (req, res) =>{
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

export const createrProductController = async (req, res) => {
  try {
    const { new_product } = req.body
    const product = await ProductRepository.createProduct({...new_product, seller_id: req.user.user_id})
    res.json({
      status: 200,
      message: "Product created successfully",
      ok: true,
      data: product()
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
