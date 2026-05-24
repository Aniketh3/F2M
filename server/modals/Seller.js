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
    },
    isEscrow:{
        type:Boolean,
        default:false
    },
    escrowAddress:{
        type:String,
        default:null
    },
    escrowStatus:{
        type:String,
        enum:['Created', 'Active', 'Delivered', 'Completed', 'Rejected', 'Refunded', 'None'],
        default:'None'
    }
})

const notificationSchema = new mongoose.Schema({
    type: { type: String, default: "BuyRequest" },
    message: { type: String },
    buyerName: { type: String },
    buyerPhone: { type: String },
    orderID: { type: String },
    itemName: { type: String },
    status: { type: String, default: 'Pending' }, 
    date: { type: Date, default: Date.now }
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
    },
    Notifications:{
        type:[notificationSchema],
        default:[]
    },
    WalletAddress:{
        type:String,
        default:null
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