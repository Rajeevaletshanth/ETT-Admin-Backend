const express = require("express");
const router = express.Router();

const controller = require('../controllers/superadminController');
const {adminAuthenticateToken} = require("../auth/authentication")


//Uncomment this and register superadmin
// router.post('/superadmin_register', controller.superadmin_register)

router.post('/create', adminAuthenticateToken, controller.create)
router.get('/list', adminAuthenticateToken, controller.getAll)
router.get('/unverified_users', adminAuthenticateToken, controller.getAll_unverified_users)
router.get('/verify_user/:admin_id', adminAuthenticateToken, controller.verify_user)
router.get('/:id', adminAuthenticateToken, controller.getByid)
router.post('/get_bymail', adminAuthenticateToken, controller.getByEmail)
router.put('/access_control/:id', adminAuthenticateToken, controller.access_control)
router.delete('/delete/:id', adminAuthenticateToken, controller.delete)

module.exports = router;