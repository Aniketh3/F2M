const mongoose = require('mongoose')

const orders = new mongoose.Schema({
    OrderId:{
        type:String,
        unique:true,
        required:true
    },
    OrderItem:{
        type:String,
        required:true

    },
    OrderQuantity:{
        type:Number,
        required:true

    },
    SingleItemPrice:{
        type:Number,
        required:true

    },
    TotalPrice:{
        type:Number,
        required:true
    },
    isTransactionComplete:{
        type:Boolean
    },
    isItemDelivered:{
        type:Boolean
    }
})

const buyerSchema = new mongoose.Schema({
Name:{
    type:String,
    required:true,
    
},
PIN:{
    type:Number,
    required:true
},
PhoneNumber:{
    type:String,
    required:true
},
Email:{
    type:String,
    required:true
},
AadharNumber:{
    type:String,
    required:true
},
GSTNumber:{
    type:String, 
    required:true
},
Address:{
    type:String,
    required:true
},
MyOrders:{
    type:[orders],
    default:[]
}
})

const BuyerSchema  = mongoose.model("Buyer",buyerSchema)
module.exports = BuyerSchema
// Name
// Number
// Email
// Aadhar number
// GST number (for invoice)
// Location