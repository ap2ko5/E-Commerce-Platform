const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const stripe = require('stripe');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  stock: Number,
  rating: { type: Number, default: 0 },
  reviews: [{
    user: String,
    comment: String,
    rating: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  address: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: { type: String, default: 'pending' },
  paymentId: String,
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// API Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payment', async (req, res) => {
  try {
    const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd'
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
