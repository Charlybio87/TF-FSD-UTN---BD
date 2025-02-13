// Crear el modelo de productos

import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,  
        required: true,
    },
    stock: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Asegúrate de que esto coincida con el nombre del modelo User
        required: true
    },

    active: {
        type: Boolean,
        default: true
    }
}, 
    {
        timestamps: true
    }
);

const Product = mongoose.model('Product', productSchema)

export default Product
