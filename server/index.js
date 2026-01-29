const express = require('express')
const cors = require('cors')
const Buyer = require('./modals/Buyer')
const Seller = require('./modals/Seller')
const app = express()
const jwt = require('jsonwebtoken');
const mongoose= require('mongoose')
const bodyParser = require('body-parser')
const escrowRoutes = require('./routes/escrow')
const SECRET_KEY = 'Farm2Market'; // Replace with your secret key
// Allow CORS only from the frontend port (adjust origin as needed)
app.use(cors({
    origin: [
        'http://localhost:19006', // Expo Go default
        'http://localhost:3000',  // Web frontend
        'http://192.168.0.101:8081',  // React Native local
        'http://127.0.0.1:19006',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8081',
    ],
    credentials: true,
}))
app.use(bodyParser.json());
const crypto = require('crypto')

//mongoconnect
mongoose.connect("mongodb+srv://aravind:aravind@cluster0.pjj53wk.mongodb.net/",
    { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
        console.log("Connected to Mongo DB")
    }).catch((err) => {
        console.log("Error connecting to mongo DB", err)
    })


function generateToken(username, pin) {
    const payload = {
      username,
      pin
    };
  
    const options = {
      expiresIn: '1h' // Set the expiration time as needed
    };
  
    const token = jwt.sign(payload, SECRET_KEY, options);
  
    // Generate a 16-character token by hashing the JWT
    const hash = require('crypto').createHash('sha256').update(token).digest('hex').slice(0, 16);
  
    return { token, hash };
  }
  function generateOrderId() {
    return crypto.randomBytes(6).toString('base64').replace(/\+/g, '0').replace(/\//g, '0').substring(0, 8);
}


app.get("/",(req,res)=>{
    res.send("Hello F2M")
})

app.post("/seller/login",async(req,res)=>{
    const {Name,PIN} = req.body;
    if(!Name || !PIN){
        res.status(403).json("Invalid credentials")
    }
    else{
        const user =  await Seller.findOne({Name:Name})
        if(!user){
            res.send(500).json({message:"No user Found"})
        }
        if(user.PIN!==null && user.PIN===PIN){

            const { token, hash } = generateToken(Name, PIN);
            res.status(200).json({message:"Login Successful",token:token,hash:hash})
        }
        else{
            res.status(404).json({message:"Login UnSuccessful",token:null,hash:null})
        }
    }
})
app.post("/seller/register",async(req,res)=>{
    console.log(req.body)
    const {Name,PIN,PhoneNumber,AadharNumber,Address,FruitsID} = req.body;
    if(!Name || !PIN || !PhoneNumber || !AadharNumber || !FruitsID){
        res.status(403).json("Invalid registration")
    }
    else{
        const user =  await Seller.findOne({Name:Name,AadharNumber:AadharNumber})
        if(user){
            res.status(500).json({message:"User already exists with creadentials"})
        }
        const seller = new Seller({Name,PIN,PhoneNumber,AadharNumber,Address,FruitsID})
        await seller.save()

        res.status(200).json({ message: "registration successful please check email for verification" })


    }
})

app.post("/buyer/login",async(req,res)=>{
    const {Name,PIN} = req.body;
    if(!Name || !PIN){
        res.status(403).json("Invalid credentials")
    }
    else{
        const user =  await Buyer.findOne({Name:Name})
        if(!user){
            res.status(500).json({message:"No user Found"})
        }
        if(user.PIN!=null && user.PIN==PIN){

            const { token, hash } = generateToken(Name, PIN);
            res.status(200).json({message:"Login Successful",token:token,hash:hash})
        }
    }
})
app.post("/buyer/register",async(req,res)=>{
    const {Name,PIN,PhoneNumber,Email,AadharNumber,Address,GSTNumber} = req.body;
    if(!Name || !PIN || !PhoneNumber || !AadharNumber || !GSTNumber || !Address || !Email){
        res.status(403).json("Invalid registration")
    }   
    else{
        const user =  await Buyer.findOne({Name:Name, AadharNumber:AadharNumber})
        if(user){
            res.status(500).json({message:"User already exists with creadentials"})
        }
        const buyer = new Buyer({Name,PIN,PhoneNumber,Email,AadharNumber,Address,GSTNumber})
        await buyer.save()

        res.status(200).json({ message: "registration successful please check email for verification" })

    }
})

app.post("/sellerSale",async(req,res)=>{
    const username = req.query.username
    const orderID = generateOrderId()
    let name
    console.log(username)
    const {SellItem,SellQuantity,SaleAmount} = req.body
    try{
        const selllist = {
            OrderID :orderID,
            isTransactionComplete:false,
            TransactionStatus:"Pending",
            SellItem:SellItem,
            SellQuantity:SellQuantity,
            SaleAmount:SaleAmount
        }
         const seller = await Seller.findOneAndUpdate(
            {Name: username },
            {$push:{MySellList: selllist}} ,
            {new:true}
        );
        if(seller){
            console.log(seller)
            res.status(200).json({message:"1Sale List Updated Successfully"})
        }
        else{
            const NewSeller = new Seller(
                {Name:username},
                {MySellList:selllist},
                {new:true}
            )
            if(NewSeller){
                res.status(200).json({message:"Sale List Updated Successfully"})
                return
            }
        }
        
    }catch(err){
        console.log(err)
    }
})

app.get("/sellerSaleList",async(req,res)=>{
    const username = req.query.username
    try{
        const seller = await Seller.findOne({Name:username})
        if(seller){
            res.status(200).json({seller:seller.MySellList})
        }
        else{
            res.status(403).json({seller:null})
        }
    }catch(err){

    }
})

app.get("/market-view",async(req,res)=>{
    try{
        const sellers = await Seller.aggregate([
            {
              $project: {
                Name: 1,
                MySellList: {
                  $filter: {
                    input: '$MySellList',
                    as: 'sell',
                    cond: { $eq: ['$$sell.isTransactionComplete', false] },
                  },
                },
              },
            },
          ]);
          console.log(sellers)
          res.status(200).json(sellers);
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Error in fetching Sale lists"})

    }
})

app.post("/market-search",async(req,res)=>{
    try{
        const {item} = req.body
        if(!item){
            return res.status(400).json({ message: 'Key and value are required' });
        }
        const sellers = await Seller.aggregate([
            {
              $project: {
                Name: 1,
                MySellList: {
                  $filter: {
                    input: '$MySellList',
                    as: 'sell',
                    cond: {
                      $and: [
                        { $eq: ['$$sell.isTransactionComplete', false] },
                        { $eq: [`$$sell.SellItem`, item] },
                      ],
                    },
                  },
                },
              },
            },
          ]);
          res.status(200).json(sellers)
          
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Couldnt place Search"})
    }
})

// ============================================================================
// BLOCKCHAIN/ESCROW ROUTES
// ============================================================================
app.use('/escrow', escrowRoutes);

app.listen(3000,()=>{
    console.log("Server up and running")
})