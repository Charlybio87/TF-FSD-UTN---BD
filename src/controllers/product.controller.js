import Product from "../models/products.model.js"

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

export const createProductController = async (req, res) => {
  try {
    const { title, price, stock, description, category, seller_id } = req.body
    const product = await Product.create(
      { 
        title,
        price,
        stock,
        description,
        category,
        seller_id
      }
    )
    
    res.json({
      status: 201,
      message: "Product created successfully",
      ok: true,
      data: {
        product
      }
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

export const deleteProductController = async (req, res) => {
  try {
      const { product_id } = req.params
      if (!product_id) {
          return res.status(400).json({ message: "Es necesario un numero de ID!!" })
      }

      const product = await Product.findByIdAndDelete(product_id);
      
      if (product) {
          res.status(200).json({ message: "Producto eliminado correctamente!!" })
      } else {
          res.status(404).json({ message: "Producto no encontrado!!" })
      }
  } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Error al eliminar el producto!!" })
  }
}

export const getProductByIdController = async (req, res, next) => {
  try {
      const { product_id } = req.params
      if (!product_id) {
          return next(new AppError('Se necesita un product_id', 400))
      }

      const product = await Product.findById(product_id);

      if (product) {
          res.status(200).json({
              ok:true,
              message:'Producto obtenido',
              payload: {
                  product: product
              }
          })
      } else {
          return next(new AppError('Producto no encontrado', 404))
      }
  } catch (error) {
      next(error)
  }
}

export const getAllProductController = async (req, res) => {
  try {
      const products = await Product.find() // Obtener todos los productos directamente del modelo
      .populate('seller_id','username email')
      res.status(200).json({
          ok: true,
          payload: {
              products
          }
      })
  } catch (error) {
      console.error(error)
      res.status(500).json({
          ok: false,
          message: "Hubo un error al obtener los productos!!", 
          error: "Hubo un error al obtener los productos!!"
      })
  }
}
