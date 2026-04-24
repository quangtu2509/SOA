const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./models/Product');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error(err));

// 1. GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    // Search query
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const products = await Product.find(filter).skip(skip).limit(pageSize);
    const totalItems = await Product.countDocuments(filter);

    res.json({
      status: "success",
      data: products,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      }
    });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

// 2. GET /api/products/{id}
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ status: "error", message: "Not found" });
    res.json({ status: "success", data: product });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

// 3. POST /api/products
app.post('/api/products', async (req, res) => {
  try {
    // Generate new ID (Ví dụ: tạo ID ngẫu nhiên hoặc có thể tự truyền lên)
    const newId = `P${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const productData = { ...req.body, id: newId };
    
    const newProduct = new Product(productData);
    await newProduct.save();
    
    res.status(201).json({ 
      status: "success", 
      message: "Product created", 
      data: { id: newProduct.id } 
    });
  } catch (error) { res.status(400).json({ status: "error", message: error.message }); }
});

// 4. PUT /api/products/{id}/reduce-stock
app.put('/api/products/:id/reduce-stock', async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findOne({ id: req.params.id });
    
    if (!product) return res.status(404).json({ status: "error", message: "Product not found" });
    if (product.stock < quantity) return res.status(400).json({ status: "error", message: "Not enough stock" });

    product.stock -= quantity;
    await product.save();

    res.json({
      status: "success",
      message: "Stock updated",
      data: { 
        productId: product.id, 
        remainingStock: product.stock 
      }
    });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

const PORT = process.env.PORT || 8001;
// 5. PUT /api/products/{id}/restore-stock (API Bồi thường)
app.put('/api/products/:id/restore-stock', async (req, res) => {
    try {
      const { quantity } = req.body;
      // Kiểm tra dữ liệu đầu vào
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ status: "error", message: "Invalid quantity" });
      }
  
      const product = await Product.findOne({ id: req.params.id });
      
      if (!product) return res.status(404).json({ status: "error", message: "Product not found" });
  
      // Cộng lại số lượng tồn kho
      product.stock += quantity;
      await product.save();
  
      res.json({
        status: "success",
        message: "Stock restored",
        data: { 
          productId: product.id, 
          remainingStock: product.stock 
        }
      });
    } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
  });
app.listen(PORT, () => console.log(`🚀 Product Service running on port ${PORT}`));