import express from 'express'
import ENVIROMENT from '../config/enviroment.js'
import { createrProductController, requestProductController } from '../controllers/product.controller.js'

const productRoute = express.Router()

// productRouter.get('/:product_id')
productRoute.get('/request', requestProductController)
productRoute.post('/', createrProductController)
// productRouter.post('/')
// productRouter.put('/:product_id')
// productRouter.delete('/:product_id')

export default productRoute