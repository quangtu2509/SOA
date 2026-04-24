const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/wallets/:userId', paymentController.getWalletBalance);
router.post('/pay', paymentController.pay);
router.post('/refund', paymentController.refund);
router.post('/wallets/topup', paymentController.topup);

module.exports = router;