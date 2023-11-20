const bcrypt = require("bcrypt");
const saltRounds = 10;
const db = require('../db_connect');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const transporter = require('../services/nodemailer/mailer');
require('dotenv').config();

const {generateUserAccessToken} = require('../auth/user_authentication')

const User = require('../models/user');

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
                            const newUser = new User({
                                username: username,
                                address: address,
                                authority: authority,
                                phone_no: phone_no,
                                email: email,
                                password: hash,
                                avatar: avatar
                            })
                            await newUser.save()
                            res.send({ "response": "success", user: newUser });
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
                const user = await User.findAll({
                    where: {
                        email: email                        
                    }
                })
                if(user.length > 0){  
                    if(!user[0].is_deleted) {               
                        bcrypt.compare(password, user[0].password, (err,response) => {
                            if(response){                               
                                    logger.log({
                                        level: 'info',
                                        message: `${email} logged in...`
                                    });
                                    
                                    let access_role = user[0].authority;
                                    //jwt
                                    const user_det = {id: user[0].id, avatar: user[0].avatar, username:user[0].username, email:user[0].email, authority: access_role}  
                                    let access_token = "";
                                    let roles = JSON.parse(user[0].authority).role;      

                                    access_token = generateUserAccessToken(user_det, signedIn);
                                                                   
                                    res.json({
                                        user: user_det,
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
            const user = await User.findAll({
                where: {
                    id: id
                }
            })
            if(user.length > 0)
                res.send({"response": "success", user})
            else
                res.send({"response": "error", "message" : "User doesn't exist"})
        } catch(error) {
            console.log(error)
        }
    },

    getByEmail: async (req, res) => {
        const email = req.body.email;
        try {
            const user = await User.findAll({
                where: {
                    email: email
                }
            })
            if(user.length > 0)
                res.send({"response": "success", user})
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
            const user = await User.update({
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
            if(user[0] > 0)
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
            const user = await User.findAll({
                where: {
                    email: email
                }
            })
            if(user.length > 0){
                const secret = process.env.JWT_SECRET + user[0].password;
                const payload = {
                    email: user[0].email,
                    id: user[0].id
                }
                const token = jwt.sign(payload, secret, {expiresIn: '15m'});
                const link = `${process.env.CLIENT_URL}/reset_password/${user[0].id}/${token}`;

                let mailOptions = {
                    from: `LTW Tech <${process.env.MAILER_USER}>`, 
                    to: user[0].email,
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
                  const user = await User.findAll({
                      where: {
                          id: id
                      }
                  })
                  if(user.length > 0){
                      bcrypt.compare(currentPassword, user[0].password, (err,response) => {
                          if(response){
                            bcrypt.hash(newPassword, saltRounds, async (hashErr, newHash) => {
                                if (hashErr) {
                                    res.send({"response": "error", "message" : "Encryption error!"});
                                } else {   
                                    try { 
                                        await User.update({
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
            const user = await User.findAll({
                where: {
                    id: id
                }
            })
            if(user.length > 0){
                const secret = process.env.JWT_SECRET + user[0].password;
                try{
                    jwt.verify(token, secret);
                    bcrypt.hash(password, saltRounds, async (err, hash) => {
                        if (err) {
                            res.send({"response": "error", "message" : "Encryption error!"});
                        } else {   
                            try { 
                                await User.update({
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
            const user = await User.update({
                is_deleted : is_deleted
            },
            {
                where: {
                    id: id
                }
            })
            if(user[0] > 0)
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
            res.send({response: "success", message:"Undefined error occured!,", error: [error]})                       
        }         
    },

    //Hard delete
    delete : async(req, res) => {
        const  { id } = req.params;

        try {
            const user = await User.destroy({
                where: {
                    id: id
                }
            })

            if(user > 0)
                res.send({"response": "success", "message" : "Successfully deleted."})
            else
                res.send({"response" : "error", "message" : "Sorry, failed to delete!"})
        } catch(error) {
            res.send({response: "success", message:"Undefined error occured!,", error: [error]})                     
        }
    }
}