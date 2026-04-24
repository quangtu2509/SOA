const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Định nghĩa một placeholder icon URL (ví dụ từ một dịch vụ cung cấp icon)
const placeholderIconUrl = 'https://img.icons8.com/plasticine/100/product--v1.png';

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Đang kết nối DB và dọn dẹp data cũ...');
    await Product.deleteMany({}); // Xóa data cũ trên Cloud

    const products = [];
    for (let i = 1; i <= 50; i++) {
      products.push({
        id: `P${i.toString().padStart(3, '0')}`,
        name: `Áo thun Local Brand Mẫu ${i}`,
        price: 150000,
        stock: 50,
        description: `Áo cotton form rộng mẫu số ${i}`,
        imageUrl: placeholderIconUrl // Sử dụng placeholder cho tất cả sản phẩm
      });
    }

    await Product.insertMany(products);
    console.log('✅ Đã đẩy thành công 50 sản phẩm (có placeholder icon) vào MongoDB trên Cloud!');
    process.exit();
  })
  .catch(err => {
    console.error('Lỗi:', err);
    process.exit(1);
  });