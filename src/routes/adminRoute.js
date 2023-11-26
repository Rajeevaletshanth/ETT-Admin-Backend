const express = require("express");
const router = express.Router();

const controller = require('../controllers/adminController');
const {authenticateToken} = require("../auth/authentication")

router.post('/register', controller.register)
router.post('/login', controller.login)
router.get('/:id', authenticateToken, controller.getByid)
router.post('/get_admin', authenticateToken, controller.getByEmail)
router.put('/edit/:id', authenticateToken, controller.editProfile)
router.post('/forgot_password', controller.forgot_password)
router.put('/change_password/:id', authenticateToken, controller.change_password)
router.post('/reset_password/:id/:token', controller.reset_password)
// router.put('/access_control/:id', authenticateToken, controller.access_control)
router.delete('/delete/:id', authenticateToken, controller.delete)

module.exports = router;