const mongoose =  require('mongoose')

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
    }
})
const sellList = new mongoose.Schema({
    OrderID:{
        type: String,
        required:true
    },
    isTransactionComplete:{
        type:Boolean
    },
    TransactionStatus:{
        type:String
    },
    SellItem:{
        type:String
    },
    SellQuantity:{
        type:Number
    },
    SaleAmount:{
        type:Number
    }
})

const sellerSchema = new mongoose.Schema({
    Name:{
        type:String,
        required:true,
    },
    PIN:{
        type:Number,
        required:true,
        unique:true
    },
    PhoneNumber:{
        type: String,
        required:true
    },
    AadharNumber:{
        type:String,
        unique:true,
        required:true
    },
    Address:{
        type:String,
    },
    FruitsID:{
        type:String,
        unique:true
    },
    Orders:{
        type:[orders],
        default:[],
        required:true
    },
    MySellList:{
        type:[sellList],
        default:[],
        required:true
    }

})

// Name
// Number
// Aadhar number
// Address
// Fruit id verification()
// Pin

const Seller = mongoose.model("seller", sellerSchema)
module.exports = Seller