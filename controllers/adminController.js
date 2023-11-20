const bcrypt = require("bcrypt");
const saltRounds = 10;
const db = require('../db_connect');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const transporter = require('../services/nodemailer/mailer');
require('dotenv').config();

const {generateAccessToken, generateAdminAccessToken} = require('../auth/authentication')

const Admin = require('../models/admin');

module.exports = {
    register: async (req, res) => {
        const username = req.body.username;         
        const address = req.body.address;
        const authority = JSON.stringify(req.body.authority);
        const phone_no = req.body.phone_no;
        const email = req.body.email;
        const password = req.body.password; 
        const avatar = req.body.avatar;

        try {
            if(JSON.parse(authority).role.length === 1 && process.env.USER_ROLES.includes(JSON.parse(authority).role[0])){
                bcrypt.hash(password, saltRounds, async (err, hash) => {
                    if (err) {
                        res.send({"response": "error", "message" : "Encryption error!"});
                    } else {   
                        try { 
                            const newAdmin = new Admin({
                                username: username,
                                address: address,
                                authority: authority,
                                phone_no: phone_no,
                                email: email,
                                password: hash,
                                avatar: avatar
                            })
                            await newAdmin.save()
                            res.send({ "response": "success", admin: newAdmin });
                        } catch(error) { 
                            res.send({"response": "error", "message" : "This email is already registered. Please login!"});
                        }         
                    }
                });
            }else{
                res.send({"response": "error", "message" : "Please select a valid role!"});
            }
        } catch (error) {
            res.send({"response": "error", "message" : "Undefined error occured!"});
        }
    },

    login : async (req, res) => {
        const email = req.body.email;
        const password = req.body.password;
        const signedIn = req.body.signedIn;
      
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            logger.log({
                level: 'error',
                message: `${email} : encryption error!`
            });
            res.send({"response": "error", "message" : "Encryption error!"});
          } else {
            try {
                const admin = await Admin.findAll({
                    where: {
                        email: email                        
                    }
                })
                if(admin.length > 0){  
                    if(!admin[0].is_deleted) {               
                        bcrypt.compare(password, admin[0].password, (err,response) => {
                            if(response){                               
                                    logger.log({
                                        level: 'info',
                                        message: `${email} logged in...`
                                    });
                                    
                                    let access_role = admin[0].authority;
                                    //jwt
                                    const user = {id: admin[0].id, avatar: admin[0].avatar, username:admin[0].username, email:admin[0].email, authority: access_role}  
                                    let access_token = "";
                                    let roles = JSON.parse(admin[0].authority).role;
                                    if(roles.includes('superadmin') || roles.includes('admin')){
                                        access_token = generateAdminAccessToken(user, signedIn);
                                    }else{
                                        access_token = generateAccessToken(user, signedIn);
                                    }                                                                    
                                    res.json({
                                        user: user,
                                        token: access_token,
                                        isLoggedIn : true
                                    });
                            }else{
                                logger.log({
                                    level: 'error',
                                    message: `${email} : Wrong Email/ Password combination!`
                                });
                                res.send({"response": "error", "message" : "Wrong Email/ Password combination"});                                
                            }
                        })
                    }else{
                        res.send({"response": "error", "message" : "This account is suspended"});
                    }
                }else{
                    res.send({"response": "error", "message" : "User doesn't exist"});
                }
            }catch(error){
                res.send({"response": "error", "message" : "500 Internal Server Error"});
            }
          }
        });
      },

    getByid: async (req, res) => {
        const id = req.params.id
        try {
            const admin = await Admin.findAll({
                where: {
                    id: id
                }
            })
            if(admin.length > 0)
                res.send({"response": "success", admin})
            else
                res.send({"response": "error", "message" : "User doesn't exist"})
        } catch(error) {
            console.log(error)
        }
    },

    getByEmail: async (req, res) => {
        const email = req.body.email;
        try {
            const admin = await Admin.findAll({
                where: {
                    email: email
                }
            })
            if(admin.length > 0)
                res.send({"response": "success", admin})
            else
                res.send({"response": "error", "message" : "User doesn't exist"})
        } catch(error) {
            res.send({"response": "error", "message" : "User doesn't exist"})
        }
    },

    editProfile : async(req, res) => {
        const  { id } = req.params;
        const username = req.body.username;         
        const address = req.body.address;
        const phone_no = req.body.phone_no;
        const avatar = req.body.avatar;

        try {
            const admin = await Admin.update({
                username: username,
                address: address,
                phone_no: phone_no,
                avatar : avatar
            },
            {
                where: {
                    id: id
                }
            })
            if(admin[0] > 0)
                res.send({"response": "success", "message" : "Successfully updated."})
            else
                res.send({"response" : "error", "message" : "Sorry, failed to update!"})
        } catch(error) {
            res.send({"response" : "error", "message" : "Sorry, User is deleted or suspended!"})                     
        }         
    },

    forgot_password : async(req, res) => {
        const email = req.body.email;
        try {
            const admin = await Admin.findAll({
                where: {
                    email: email
                }
            })
            if(admin.length > 0){
                const secret = process.env.JWT_SECRET + admin[0].password;
                const payload = {
                    email: admin[0].email,
                    id: admin[0].id
                }
                const token = jwt.sign(payload, secret, {expiresIn: '15m'});
                const link = `${process.env.CLIENT_URL}/reset_password/${admin[0].id}/${token}`;

                let mailOptions = {
                    from: `LTW Tech <${process.env.MAILER_USER}>`, 
                    to: admin[0].email,
                    subject: 'Reset Password', 
                    html: `<b> Click here to reset password : </b> <br/> ${link}`
                }

                transporter.sendMail(mailOptions, (err, info) => {
                    if(err){
                        res.send({"response" : "error", "message" : err})
                    }else{
                        res.send({"response" : "success", "message" : info})
                    }
                })
            }else{
                res.send({"response" : "error", "message" : "Email not found!"})
            }
        } catch (error) {
            res.send({"response" : "error", "message" : error})
        }
    },

    change_password: async (req, res) => {
        const { id } = req.params;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;

        bcrypt.hash(currentPassword, saltRounds, async (err, hash) => {
            if (err) {
              res.send({"response": "error", "message" : "Encryption error!"});
            } else {
              try {
                  const admin = await Admin.findAll({
                      where: {
                          id: id
                      }
                  })
                  if(admin.length > 0){
                      bcrypt.compare(currentPassword, admin[0].password, (err,response) => {
                          if(response){
                            bcrypt.hash(newPassword, saltRounds, async (hashErr, newHash) => {
                                if (hashErr) {
                                    res.send({"response": "error", "message" : "Encryption error!"});
                                } else {   
                                    try { 
                                        await Admin.update({
                                            password: newHash
                                        },{
                                            where: {
                                                id: id
                                            }
                                        })
                                        res.send({ "response": "success", "message": "Password successfully updated." });
                                    } catch(error) { 
                                        res.send({"response": "error", "message" : "Sorry, password not updated. Please try again later!"});
                                    }         
                                }
                            });
                          }else{
                              res.send({"response": "error", "message" : "Current password is wrong!"});
                          }
                      })
                  }else{
                      res.send({"response": "error", "message" : "This account is deleted or suspended!"});
                  }
              }catch(error){
                res.send({"response": "error", "message" : "Account not found!"});
              }
            }
          });
    },

    reset_password : async(req ,res) => {
        const { id, token } = req.params;
        const password = req.body.password;

        try {
            const admin = await Admin.findAll({
                where: {
                    id: id
                }
            })
            if(admin.length > 0){
                const secret = process.env.JWT_SECRET + admin[0].password;
                try{
                    jwt.verify(token, secret);
                    bcrypt.hash(password, saltRounds, async (err, hash) => {
                        if (err) {
                            res.send({"response": "error", "message" : "Encryption error!"});
                        } else {   
                            try { 
                                await Admin.update({
                                    password: hash
                                },{
                                    where: {
                                        id: id
                                    }
                                })
                                res.send({"response": "success", "message": "Password updated!"})
                            } catch(error) { 
                                res.send({"response": "error", "message" : "Unable to update password! Please try again later."});
                            }         
                        }
                    });
                }catch(error){
                    res.send({"response": "error", "message" : "Token expired. Please request again."})
                }
            }
        } catch (error) {
            res.send({"response": "error", "message" : "Sorry this user is deleted or suspended."})
        }
    },

    //Soft delete and activate
    access_control : async(req, res) => {
        const  { id } = req.params;
        const is_deleted = req.body.is_deleted;

        try {
            const admin = await Admin.update({
                is_deleted : is_deleted
            },
            {
                where: {
                    id: id
                }
            })
            if(admin[0] > 0)
                if(is_deleted)
                    res.send({"response": "success", "message" : "Successfully suspended."})
                else
                    res.send({"response": "success", "message" : "Successfully activated."})
            else
                if(is_deleted)
                    res.send({"response": "error", "message" : "Sorry, failed to suspend!"})
                else
                    res.send({"response": "error", "message" : "Sorry, failed to activate!"})
        } catch(error) {
            console.log(error)                       
        }         
    },

    //Hard delete
    delete : async(req, res) => {
        const  { id } = req.params;

        try {
            const admin = await Admin.destroy({
                where: {
                    id: id
                }
            })
            console.log(admin)
            if(admin > 0)
                res.send({"response": "success", "message" : "Successfully deleted."})
            else
                res.send({"response" : "error", "message" : "Sorry, failed to delete!"})
        } catch(error) {
            console.log(error)                       
        }
    }
}