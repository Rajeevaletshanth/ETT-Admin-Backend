const express = require("express");
const router = express.Router();

const controller = require('../controllers/userController');
const {adminAuthenticateToken} = require("../auth/authentication")
const {userAuthenticateToken} = require("../auth/user_authentication")

router.post('/register', controller.register)
router.post('/login', controller.login)
router.get('/:id', userAuthenticateToken, controller.getByid)
router.post('/get_admin', userAuthenticateToken, controller.getByEmail)
router.put('/edit/:id', userAuthenticateToken, controller.editProfile)
router.post('/forgot_password', controller.forgot_password)
router.put('/change_password/:id', userAuthenticateToken, controller.change_password)
router.post('/reset_password/:id/:token', controller.reset_password)
// router.put('/access_control/:id', userAuthenticateToken, controller.access_control)
router.delete('/delete/:id', userAuthenticateToken, controller.delete)

module.exports = router;