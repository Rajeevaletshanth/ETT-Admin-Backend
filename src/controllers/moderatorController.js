const bcrypt = require("bcrypt");
const saltRounds = 10;
const db = require('../db_connect');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const transporter = require('../services/nodemailer/mailer');
require('dotenv').config();

const {generateAccessToken, generateAdminAccessToken} = require('../auth/authentication')

const Moderator = require('../models/moderator');

module.exports = {
    register: async (req, res) => {
        const username = req.body.username;   
        const company = req.body.company;
        const company_type = req.body.company_type;
        const website = req.body.website;      
        const address = req.body.address;
        const authority = JSON.stringify(req.body.authority);
        const phone_no = req.body.phone_no;
        const email = req.body.email;
        const password = req.body.password; 
        const avatar = req.body.avatar;

        try {
            if(JSON.parse(authority).role.length === 1 && process.env.MODERATOR_ROLES.includes(JSON.parse(authority).role[0])){
                bcrypt.hash(password, saltRounds, async (err, hash) => {
                    if (err) {
                        res.send({"response": "error", "message" : "Encryption error!"});
                    } else {   
                        try { 
                            const newMod = new Moderator({
                                username: username,
                                address: address,
                                authority: authority,
                                company: company,
                                company_type: company_type,
                                website: website,
                                phone_no: phone_no,
                                email: email,
                                password: hash,
                                avatar: avatar
                            })
                            await newMod.save()
                            res.send({ "response": "success", admin: newMod });
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
                const moderator = await Moderator.findAll({
                    where: {
                        email: email                        
                    }
                })
                if(moderator.length > 0){  
                    if(!moderator[0].is_deleted) {               
                        bcrypt.compare(password, moderator[0].password, (err,response) => {
                            if(response){                               
                                    logger.log({
                                        level: 'info',
                                        message: `${email} logged in...`
                                    });
                                    
                                    let access_role = moderator[0].authority;
                                    //jwt
                                    const user = {id: moderator[0].id, avatar: moderator[0].avatar, username:moderator[0].username, email:moderator[0].email, authority: access_role}  
                                    let access_token = "";
                                    let roles = JSON.parse(moderator[0].authority).role;
                                    access_token = generateAccessToken(user, signedIn);
                                                                   
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
            const moderator = await Moderator.findAll({
                where: {
                    id: id
                }
            })
            if(moderator.length > 0)
                res.send({"response": "success", admin : moderator})
            else
                res.send({"response": "error", "message" : "User doesn't exist"})
        } catch(error) {
            console.log(error)
        }
    },

    getByEmail: async (req, res) => {
        const email = req.body.email;
        try {
            const moderator = await Moderator.findAll({
                where: {
                    email: email
                }
            })
            if(moderator.length > 0)
                res.send({"response": "success", admin : moderator})
            else
                res.send({"response": "error", "message" : "User doesn't exist"})
        } catch(error) {
            res.send({"response": "error", "message" : "User doesn't exist"})
        }
    },

    editProfile : async(req, res) => {
        const  { id } = req.params;
        const username = req.body.username; 
        const company = req.body.company;
        const company_type = req.body.company_type;
        const website = req.body.company_type;        
        const address = req.body.address;
        const phone_no = req.body.phone_no;
        const avatar = req.body.avatar;

        try {
            const moderator = await Moderator.update({
                username: username,
                address: address,
                phone_no: phone_no,
                company: company,
                company_type: company_type,
                website: website,
                avatar : avatar
            },
            {
                where: {
                    id: id
                }
            })
            if(moderator[0] > 0)
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
            const moderator = await Moderator.findAll({
                where: {
                    email: email
                }
            })
            if(moderator.length > 0){
                const secret = process.env.JWT_SECRET + moderator[0].password;
                const payload = {
                    email: moderator[0].email,
                    id: moderator[0].id
                }
                const token = jwt.sign(payload, secret, {expiresIn: '15m'});
                const link = `${process.env.CLIENT_URL}/reset_password/${moderator[0].id}/${token}`;

                let mailOptions = {
                    from: `LTW Tech <${process.env.MAILER_USER}>`, 
                    to: moderator[0].email,
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
                  const moderator = await Moderator.findAll({
                      where: {
                          id: id
                      }
                  })
                  if(moderator.length > 0){
                      bcrypt.compare(currentPassword, moderator[0].password, (err,response) => {
                          if(response){
                            bcrypt.hash(newPassword, saltRounds, async (hashErr, newHash) => {
                                if (hashErr) {
                                    res.send({"response": "error", "message" : "Encryption error!"});
                                } else {   
                                    try { 
                                        await Moderator.update({
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
            const moderator = await Moderator.findAll({
                where: {
                    id: id
                }
            })
            if(moderator.length > 0){
                const secret = process.env.JWT_SECRET + moderator[0].password;
                try{
                    jwt.verify(token, secret);
                    bcrypt.hash(password, saltRounds, async (err, hash) => {
                        if (err) {
                            res.send({"response": "error", "message" : "Encryption error!"});
                        } else {   
                            try { 
                                await Moderator.update({
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
                    // console.log(error.message)
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
            const moderator = await Moderator.update({
                is_deleted : is_deleted
            },
            {
                where: {
                    id: id
                }
            })
            if(moderator[0] > 0)
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
            res.send({"response": "error", "message" : error.message})
            console.log(error)                       
        }         
    },

    // //Hard delete
    delete : async(req, res) => {
        const  { id } = req.params;

        try {
            const moderator = await Moderator.destroy({
                where: {
                    id: id
                }
            })

            if(moderator > 0)
                res.send({"response": "success", "message" : "Successfully deleted."})
            else
                res.send({"response" : "error", "message" : "Sorry, failed to delete!"})
        } catch(error) {
            console.log(error)                       
        }
    }
}