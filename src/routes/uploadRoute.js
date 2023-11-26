const express = require("express");
const router = express.Router();

const controller = require('../controllers/uploadController');

router.post('/uploadSingle', controller.uploadSingle);
router.post('/uploadMultiple', controller.uploadMultiple);
router.get('/getImage', controller.getImage)

module.exports = router;