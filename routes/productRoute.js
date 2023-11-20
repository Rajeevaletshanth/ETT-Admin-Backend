const express = require("express");
const router = express.Router();

const controller = require('../controllers/productController');
const {authenticateToken} = require("../auth/authentication")

router.post('/create_product', controller.create_product)
router.post('/create_subscription', controller.create_subscription)
router.put('/remove', controller.remove_product)


module.exports = router;