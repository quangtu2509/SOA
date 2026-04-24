const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// [POST] /api/payments/pay - Hàm trừ tiền (Saga)
exports.pay = async (req, res) => {
  const { orderId, userId, amount } = req.body;

  try {
    // 1. Tìm ví của user, nếu chưa có thì tự động tạo ví mới với 0đ
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
      await wallet.save();
    }

    // 2. Kiểm tra số dư
    if (wallet.balance < amount) {
      // Lưu vết giao dịch thất bại
      await Transaction.create({
        transactionId: `TX${Date.now()}`,
        orderId, userId, amount,
        type: 'PAYMENT', status: 'FAILED'
      });

      return res.status(400).json({
        status: "failed",
        message: "Số dư không đủ"
      });
    }

    // 3. Đủ tiền -> Trừ tiền và lưu giao dịch thành công
    wallet.balance -= amount;
    await wallet.save();

    const transaction = await Transaction.create({
      transactionId: `TX${Date.now()}`,
      orderId, userId, amount,
      type: 'PAYMENT', status: 'SUCCESS'
    });

    res.status(200).json({
      status: "success",
      message: "Thanh toán thành công",
      data: transaction
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// [POST] /api/payments/refund - Hàm bồi thường (Recovery API)
exports.refund = async (req, res) => {
  const { orderId, userId, amount } = req.body;

  try {
    // 1. Tìm lại giao dịch thanh toán thành công cũ của đơn hàng này
    const oldTransaction = await Transaction.findOne({ orderId, status: 'SUCCESS', type: 'PAYMENT' });
    if (!oldTransaction) {
      return res.status(404).json({ status: "failed", message: "Không tìm thấy giao dịch hợp lệ để hoàn tiền" });
    }

    // 2. Cộng trả lại tiền vào ví
    let wallet = await Wallet.findOne({ userId });
    wallet.balance += amount;
    await wallet.save();

    // 3. Cập nhật trạng thái giao dịch cũ thành REFUNDED
    oldTransaction.status = 'REFUNDED';
    await oldTransaction.save();

    res.status(200).json({
      status: "success",
      message: "Hoàn tiền thành công",
      data: { orderId, refundedAmount: amount, status: "REFUNDED" }
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// [POST] /api/payments/wallets/topup - Hàm nạp tiền ảo để test
exports.topup = async (req, res) => {
  const { userId, amount } = req.body;

  try {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }

    wallet.balance += amount;
    await wallet.save();

    res.status(200).json({
      status: "success",
      message: "Nạp tiền thành công",
      data: { userId, newBalance: wallet.balance }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
// [GET] /api/payments/wallets/:userId - Hàm lấy số dư ví
exports.getWalletBalance = async (req, res) => {
  const { userId } = req.params;

  try {
    // Tìm ví của user
    let wallet = await Wallet.findOne({ userId });
    
    // Nếu user chưa có ví (user mới), tự động tạo ví 0đ cho họ
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
      await wallet.save();
    }

    res.status(200).json({
      status: "success",
      data: {
        userId: wallet.userId,
        balance: wallet.balance
      }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};