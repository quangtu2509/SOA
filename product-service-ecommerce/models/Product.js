const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: [1, 'Price > 0'] },
  stock: { type: Number, required: true, min: [0, 'Stock >= 0'] },
  description: { type: String },
  imageUrl: { type: String }, // Thêm trường này vào để lưu URL ảnh hoặc icon
  createdAt: { type: Date, default: Date.now }
});

// Format lại data trả về để khớp chuẩn API (ẩn _id mặc định của Mongo)
productSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  // If imageUrl is missing, you could add a property to indicate to frontend to use a default icon
  return obj;
};

module.exports = mongoose.model('Product', productSchema);