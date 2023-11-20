const express = require("express");
const router = express.Router();
const transporter = require('./mailer');
require('dotenv').config();

var mailOptions = {
    from : process.env.MAILER_USER,
    to : process.env.YOUR_MAIL,
    subject : 'Test Mail',
    text : `Just ignore it..!`
}


router.get('/test_mail', (req, res) => {
    transporter.sendMail(mailOptions, (err, info) => {
        if(err){
            res.send(err)
        }else{
            res.send(info)
        }
    })
})

module.exports = router;

