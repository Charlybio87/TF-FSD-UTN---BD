import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
// import ENVIROMENT from '../config/enviroment.js'
import { createProductController, deleteProductController, getAllProductController, getProductByIdController, requestProductController } from '../controllers/product.controller.js'
const productRoute = express.Router()

productRoute.get('/request', requestProductController)
productRoute.post('/', authMiddleware(['admin']), createProductController)
// productRouter.put('/:product_id')
productRoute.delete('/:product_id', authMiddleware(['admin']), deleteProductController)
productRoute.get('/:product_id', authMiddleware(['user','admin']), getProductByIdController)
productRoute.get('/', authMiddleware(['user','admin']), getAllProductController)

export default productRoute