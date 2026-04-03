const express = require('express');
const cors = require('cors');
const Buyer = require('./modals/Buyer');
const Seller = require('./modals/Seller');
const Message = require('./modals/Message');
const app = express();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const escrowRoutes = require('./routes/escrow');
const crypto = require('crypto');

const SECRET_KEY = 'Farm2Market'; 

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://aravind:aravind@cluster0.pjj53wk.mongodb.net/", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => console.log("Connected to Mongo DB"))
  .catch((err) => console.log("Error connecting to mongo DB", err));

// Helpers
function generateToken(username, pin) {
    const payload = { username, pin };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
    const hash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
    return { token, hash };
}

function generateOrderId() {
    return crypto.randomBytes(6).toString('base64').replace(/\+/g, '0').replace(/\//g, '0').substring(0, 8);
}

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Access Denied" });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        req.user = user;
        next();
    });
};

// ==========================================
// 👤 PROFILE ROUTES
// ==========================================

// GET PROFILE
app.get('/profile', verifyToken, async (req, res) => {
    try {
        const { username } = req.user;
        
        // Check Seller
        const seller = await Seller.findOne({ Name: username });
        if (seller) {
            const completedSales = seller.MySellList.filter(item => item.isTransactionComplete);
            const totalEarnings = completedSales.reduce((sum, item) => sum + (item.SaleAmount || 0), 0);
            return res.status(200).json({
                success: true, role: 'seller',
                data: { ...seller._doc, stats: { orders: seller.MySellList.length, earnings: `₹${totalEarnings.toLocaleString('en-IN')}`, rating: 4.5 } }
            });
        }

        // Check Buyer
        const buyer = await Buyer.findOne({ Name: username });
        if (buyer) {
            const buyerOrders = buyer.Orders || []; 
            const totalSpent = buyerOrders.reduce((sum, item) => sum + (item.TotalPrice || 0), 0);
            return res.status(200).json({
                success: true, role: 'buyer',
                data: { ...buyer._doc, stats: { orders: buyerOrders.length, spent: `₹${totalSpent.toLocaleString('en-IN')}`, rating: 5.0 } }
            });
        }
        return res.status(404).json({ message: "User not found" });
    } catch (err) { res.status(500).json({ message: "Server Error" }); }
});

// UPDATE PROFILE
app.put('/profile/update', verifyToken, async (req, res) => {
    try {
        const { username } = req.user;
        const updates = req.body; // { PhoneNumber, Email, Address, GSTNumber, etc. }
        
        // Try updating Seller
        let user = await Seller.findOneAndUpdate({ Name: username }, { $set: updates }, { new: true });
        
        // If not seller, try Buyer
        if (!user) {
            user = await Buyer.findOneAndUpdate({ Name: username }, { $set: updates }, { new: true });
        }

        if (user) {
            res.status(200).json({ success: true, message: "Profile Updated", data: user });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Update Failed" });
    }
});

// ==========================================
// 📦 MARKET & SALES ROUTES (Fixes 404)
// ==========================================

// 1. GET Seller's Sales (Fixed Missing Route)
app.get("/sellerSaleList", async(req,res)=>{
    const username = req.query.username;
    try {
        const seller = await Seller.findOne({Name:username});
        if(seller){
            res.status(200).json({seller:seller.MySellList, notifications: seller.Notifications});
        } else {
            res.status(403).json({seller:[], notifications: []});
        }
    } catch(err){ res.status(500).send("Error"); }
});

// 2. Add New Sale
app.post("/sellerSale", async(req,res)=>{
    const username = req.query.username;
    const {SellItem,SellQuantity,SaleAmount} = req.body;
    try {
        const orderID = generateOrderId();
        const selllist = {
            OrderID: orderID,
            isTransactionComplete: false,
            TransactionStatus: "Pending",
            SellItem, SellQuantity, SaleAmount
        };
        await Seller.findOneAndUpdate({Name: username}, {$push:{MySellList: selllist}}, {new:true});
        res.status(200).json({message:"Sale List Updated Successfully", orderID});
    } catch(err){ res.status(500).json({message:"Error"}); }
});

// 3. Market View (For Buyers)
app.get("/market-view", async(req,res)=>{
    try {
        const sellers = await Seller.aggregate([
            { $project: { Name: 1, PhoneNumber: 1, MySellList: { $filter: { input: '$MySellList', as: 'sell', cond: { $eq: ['$$sell.isTransactionComplete', false] } } } } }
        ]);
        res.status(200).json(sellers);
    } catch(err){ res.status(500).json({message:"Error"}); }
});

// Search
app.post("/market-search",async(req,res)=>{
    try {
        const {item} = req.body;
        const sellers = await Seller.aggregate([
            { $project: { Name: 1, MySellList: { $filter: { input: '$MySellList', as: 'sell', cond: { $and: [ { $eq: ['$$sell.isTransactionComplete', false] }, { $eq: [`$$sell.SellItem`, item] } ] } } } } }
        ]);
        res.status(200).json(sellers);
    } catch(err){ res.status(500).json({message:"Error"}); }
});

// ==========================================
// AUTH ROUTES
// ==========================================
// DEBUGGING LOGIN ROUTE
app.post("/seller/login", async (req, res) => {
    const { Name, PIN } = req.body;
    
    // 1. Print what the Frontend sent
    console.log("--------------- LOGIN ATTEMPT ---------------");
    console.log("Input received:", { Name, PIN, TypeOfPIN: typeof PIN });

    // 2. Try to find the user
    // Note: We use .trim() to ignore accidental spaces
    const user = await Seller.findOne({ Name: Name.trim() });

    // 3. Print what the Database found
    if (!user) {
        console.log("❌ User NOT found in Database.");
        // Try printing all users to see what exists (Helpful for debugging)
        const allUsers = await Seller.find({}, 'Name'); 
        console.log("Available Users in DB:", allUsers.map(u => u.Name));
        return res.status(401).json({ message: "User does not exist" });
    }

    console.log("✅ User Found in DB:", { DB_Name: user.Name, DB_PIN: user.PIN, TypeOfDB_PIN: typeof user.PIN });

    // 4. Check PIN Match (Using Loose Equality '==' to match "1234" string with 1234 number)
    if (user.PIN == PIN) {
        console.log("✅ Password Matched!");
        const { token, hash } = generateToken(Name, PIN);
        return res.status(200).json({ message: "Success", token, hash });
    } else {
        console.log("❌ PIN Mismatch: DB has", user.PIN, "but received", PIN);
        return res.status(401).json({ message: "Invalid PIN" });
    }
});

// DELETE a specific sale item
app.delete("/sellerSale/:orderId", async (req, res) => {
    const { username } = req.query;
    const { orderId } = req.params;

    try {
        const result = await Seller.findOneAndUpdate(
            { Name: username },
            { $pull: { MySellList: { OrderID: orderId } } },
            { new: true }
        );

        if (result) {
            res.status(200).json({ message: "Item deleted successfully" });
        } else {
            res.status(404).json({ message: "Seller or Item not found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// UPDATE a specific sale item
app.put("/sellerSale/:orderId", async (req, res) => {
    const { username } = req.query;
    const { orderId } = req.params;
    const { SellItem, SellQuantity, SaleAmount } = req.body;

    try {
        const result = await Seller.findOneAndUpdate(
            { Name: username, "MySellList.OrderID": orderId },
            {
                $set: {
                    "MySellList.$.SellItem": SellItem,
                    "MySellList.$.SellQuantity": SellQuantity,
                    "MySellList.$.SaleAmount": SaleAmount
                }
            },
            { new: true }
        );

        if (result) {
            res.status(200).json({ message: "Item updated successfully" });
        } else {
            res.status(404).json({ message: "Update failed" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

app.post("/seller/register", async (req, res) => {
    const { Name, AadharNumber } = req.body;
    if (await Seller.findOne({ Name, AadharNumber })) return res.status(500).json({ message: "User exists" });
    await new Seller(req.body).save();
    res.status(200).json({ message: "Registered" });
});

app.post("/buyer/login", async (req, res) => {
    const { Name, PIN } = req.body;
    const user = await Buyer.findOne({ Name });
    if (!user || user.PIN != PIN) return res.status(401).json({ message: "Invalid credentials" });
    const { token, hash } = generateToken(Name, PIN);
    res.status(200).json({ message: "Success", token, hash });
});

app.post("/buyer/register", async (req, res) => {
    const { Name, AadharNumber } = req.body;
    if (await Buyer.findOne({ Name, AadharNumber })) return res.status(500).json({ message: "User exists" });
    await new Buyer(req.body).save();
    res.status(200).json({ message: "Registered" });
});

app.post("/sellerSale/transitStatus", async (req, res) => {
    const { orderID, sellerName, status } = req.body;
    try {
        const result = await Seller.findOneAndUpdate(
            { Name: sellerName, "MySellList.OrderID": orderID },
            { $set: { "MySellList.$.TransactionStatus": status } },
            { new: true }
        );
        if (result) res.status(200).json({ message: "Status updated" });
        else res.status(404).json({ message: "Not found" });
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

const { Jimp } = require("jimp");
const jsQR = require("jsqr");

app.post("/decode-qr", async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ message: "No image provided" });
    try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        
        const image = await Jimp.read(buffer);
        const qrCode = jsQR(new Uint8ClampedArray(image.bitmap.data), image.bitmap.width, image.bitmap.height);
        
        if (qrCode && qrCode.data) {
            res.status(200).json({ data: qrCode.data });
        } else {
            res.status(400).json({ message: "No QR code found in image" });
        }
    } catch (e) {
        console.log("Decode error:", e);
        res.status(500).json({ message: "Error decoding QR. Please ensure it is a clear image.", error: String(e) });
    }
});

app.post("/buyProduce", async (req, res) => {
    const { sellerName, buyerName, buyerPhone, orderID, itemName } = req.body;
    try {
        const notif = {
            type: "BuyRequest",
            message: `${buyerName} wants to buy your ${itemName}!`,
            buyerName,
            buyerPhone,
            orderID,
            itemName,
            status: "Pending"
        };
        await Seller.findOneAndUpdate({ Name: sellerName }, { $push: { Notifications: notif } }, { new: true });
        res.status(200).json({ message: "Notification sent to Seller" });
    } catch(err) {
        res.status(500).json({ message: "Error notifying seller" });
    }
});

app.post("/respondBuyRequest", async (req, res) => {
    const { sellerName, buyerName, orderID, itemName, status } = req.body; // status is "Accepted" or "Rejected"
    try {
        // 1. Update Seller's notification status
        await Seller.updateOne(
            { Name: sellerName, "Notifications.orderID": orderID, "Notifications.buyerName": buyerName },
            { $set: { "Notifications.$.status": status } }
        );
        
        // 2. Add Notification to Buyer
        const buyerNotif = {
            type: "OrderUpdate",
            message: `${sellerName} has ${status} your request to buy ${itemName}.`,
            sellerName,
            orderID,
            itemName,
            status
        };
        await Buyer.findOneAndUpdate({ Name: buyerName }, { $push: { Notifications: buyerNotif } });
        
        res.status(200).json({ message: "Response sent to Buyer" });
    } catch(err) {
        res.status(500).json({ message: "Error responding to request" });
    }
});

app.get("/buyerNotifications", async (req, res) => {
    const { username } = req.query;
    try {
        const buyer = await Buyer.findOne({ Name: username });
        if (buyer) {
            res.status(200).json({ notifications: buyer.Notifications });
        } else {
            res.status(404).json({ notifications: [] });
        }
    } catch (err) {
        res.status(500).json({ message: "Error fetching notifications" });
    }
});

app.use('/escrow', escrowRoutes);
// ==========================================
// 💬 GLOBAL CHAT ROUTES
// ==========================================

// 1. GET Messages
app.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find({}).sort({ timestamp: 1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: "Error fetching messages" });
    }
});

// 2. POST Message
app.post("/messages", async (req, res) => {
    const { sender, content, role } = req.body;
    if (!sender || !content) return res.status(400).json({ message: "Missing sender or content" });

    try {
        const newMessage = new Message({ sender, content, role: role || 'seller' });
        await newMessage.save();

        // 🔔 Notify all other sellers
        if (role === 'seller') {
            await Seller.updateMany(
                { Name: { $ne: sender } }, 
                { 
                    $push: { 
                        Notifications: { 
                            type: 'ChatMessage', 
                            message: `New community message from ${sender}`,
                            date: new Date()
                        } 
                    } 
                }
            );
        }

        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ message: "Error saving message" });
    }
});

// 3. Clear Chat Notifications
app.post("/clearChatNotifications", async (req, res) => {
    const { username } = req.query;
    try {
        await Seller.findOneAndUpdate(
            { Name: username },
            { $pull: { Notifications: { type: 'ChatMessage' } } }
        );
        res.status(200).json({ message: "Notifications cleared" });
    } catch (err) {
        res.status(500).json({ message: "Error clearing notifications" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));