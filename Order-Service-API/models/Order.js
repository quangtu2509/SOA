const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: String,

    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        subtotal: Number,
      },
    ],

    totalAmount: Number,

    status: {
      type: String,
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      default: "UNPAID",
    },

    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
    },

    history: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
