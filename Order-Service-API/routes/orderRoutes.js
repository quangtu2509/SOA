const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const axios = require("axios");

// 🔥 Khai báo URL lấy từ biến môi trường (Environment Variables)
// Nếu chạy ở máy ảo (Render) nó sẽ lấy link trên mạng, nếu chạy ở máy tính bạn nó sẽ lấy localhost
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:8001";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://payment-service:8003";

// 1. POST /api/orders
router.post("/", async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input",
      });
    }

    const updatedItems = [];

    // STEP 1: check product
    for (let item of items) {
      // 🔴 Sửa localhost thành PRODUCT_SERVICE_URL
      const response = await axios.get(
        `${PRODUCT_SERVICE_URL}/api/products/${item.productId}`,
      );

      const product = response.data.data;

      if (product.stock < item.quantity) {
        return res.status(400).json({
          status: "FAILED",
          message: `Product ${item.productId} out of stock`,
        });
      }

      updatedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: item.quantity * product.price,
      });
    }

    const totalAmount = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);

    for (let item of items) {
      try {
        // 🔴 Sửa localhost thành PRODUCT_SERVICE_URL
        await axios.put(
          `${PRODUCT_SERVICE_URL}/api/products/${item.productId}/reduce-stock`,
          {
            quantity: item.quantity,
          },
        );
      } catch (err) {
        return res.status(500).json({
          status: "error",
          message: "Failed to reserve stock",
        });
      }
    }

    // STEP 2: create order
    const newOrder = new Order({
      userId,
      items: updatedItems,
      totalAmount,
      status: "PENDING",
      history: [{ status: "PENDING" }],
    });

    const savedOrder = await newOrder.save();

    // STEP 3: CALL PAYMENT SERVICE (REAL)
    try {
      // 🔴 Sửa localhost thành PAYMENT_SERVICE_URL
      await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/pay`, {
        orderId: savedOrder._id,
        userId: userId,
        amount: totalAmount,
      });
    } catch (paymentError) {
      console.log("Payment failed → rollback stock");

      // 🔥 ROLLBACK STOCK
      for (let item of items) {
        try {
          // 🔴 Sửa localhost thành PRODUCT_SERVICE_URL
          await axios.put(
            `${PRODUCT_SERVICE_URL}/api/products/${item.productId}/restore-stock`,
            {
              quantity: item.quantity,
            },
          );
        } catch (err) {
          console.error("Rollback stock failed:", err.message);
        }
      }

      // 🔥 UPDATE ORDER
      savedOrder.status = "CANCELLED";
      savedOrder.history.push({
        status: "CANCELLED",
        reason: "Payment failed",
      });

      await savedOrder.save();

      return res.status(400).json({
        status: "FAILED",
        message: "Payment failed → Order cancelled",
        data: savedOrder,
      });
    }
    // SUCCESS
    savedOrder.status = "CONFIRMED";
    savedOrder.history.push({ status: "CONFIRMED" });

    await savedOrder.save();

    res.json({
      status: "success",
      data: savedOrder,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// 2. GET /api/orders/:id
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    res.json({
      status: "success",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// 3. GET /api/orders/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });

    res.json({
      status: "success",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// 4. PUT /api/orders/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // update status
    order.status = status;

    // push history
    order.history.push({
      status: status,
      timestamp: new Date(),
    });

    await order.save();

    res.json({
      status: "success",
      message: "Order status updated",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

module.exports = router;
