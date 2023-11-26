const nodemailer = require('nodemailer');
require('dotenv').config()

const transporter = nodemailer.createTransport({
    service : process.env.MAILER_SERVICE,
    secure: true,
    port: 587,
    auth : {
        user : process.env.MAILER_USER,
        pass : process.env.MAILER_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
})

module.exports = transporter;