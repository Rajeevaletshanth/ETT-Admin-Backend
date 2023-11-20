const bcrypt = require("bcrypt");
const saltRounds = 10;
require('dotenv').config();
const transporter = require('../services/nodemailer/mailer');
require('dotenv').config();

const Admin = require('../models/admin');

module.exports = {
    
    create: async (req, res) => {
        const username = req.body.username;         
        const authority = JSON.stringify(req.body.authority);
        const email = req.body.email;
        const password = req.body.password; 

        try {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    res.send({"response": "error", "message" : "Encryption error!"});
                } else {   
                    try { 
                        const newAdmin = new Admin({
                            username: username,
                            authority: authority,
                            email: email,
                            password: hash
                        })
                        await newAdmin.save()

                        let mailOptions = {
                            from: `LTW Tech <${process.env.MAILER_USER}>`, 
                            to: email,
                            subject: 'User created', 
                            html: `<b> Use this credentials to login : </b> <br/>
                                 Link : ${process.env.CLIENT_URL}/sign-in <br/>
                                 Email : ${email} <br/> 
                                 Password : ${password}`
                        }
            
                        transporter.sendMail(mailOptions, (err, info) => {
                            if(err){
                                res.send({"response" : "warning", "message" : "User created but email not send." })
                            }else{
                                res.send({"response" : "success", "message" : `User created and email sent to ${email}`})
                            }
                        })                       
                    } catch(error) { 
                        res.send({"response": "error", "message" : "This email is already registered."});
                    }         
                }
            });
        } catch (error) {
            res.send({"response": "error", "message" : "Undefined error occured!"});
        }
    },

    superadmin_register: async (req, res) => {
        const username = req.body.username;         
        const address = req.body.address;
        const authority = JSON.stringify(req.body.authority);
        const phone_no = req.body.phone_no;
        const email = req.body.email;
        const password = req.body.password; 
        const avatar = req.body.avatar;

        try {
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
        } catch (error) {
            res.send({"response": "error", "message" : "Undefined error occured!"});
        }
    },

    getAll: async (req, res) => {
        try {
            const admin = await Admin.findAll()
            if(admin.length > 0)
                res.send({"response": "success", admin})
            else
                res.send({"response": "error", "message" : "No users found!"})
        } catch(error) {
            res.send({"response": "error", "message" : "Undefined error occured!"});
        }
    },

    getAll_unverified_users: async (req, res) => {
        try {
            const admin = await Admin.findAll()
            if(admin.length > 0){
                let unverified_users = [];
                let id = 0;
                admin.map((item) => {
                    if(JSON.parse(item.authority).role.length === 1 && process.env.USER_ROLES.includes(JSON.parse(item.authority).role[0])){                        
                        unverified_users[id] = item;
                        id++;
                    }
                })             
                res.send({response: "success", unverified_users})
            }else
                res.send({response: "error", message : "No users found!"})
        } catch(error) {
            res.send({response: "error", message : "Undefined error occured!", error: [error]});
        }
    },

    verify_user: async (req, res) => {
        const { admin_id } = req.params;

        try {
            await Admin.findAll({
                where: {
                    id: admin_id
                }
            }).then(async(response) => {
                if(response.length > 0){                         
                    const current_authority = JSON.parse(response[0].authority).role[0];
                    if(process.env.USER_ROLES.includes(current_authority)){
                        const new_authority = "verified-" + current_authority;

                        const new_role = JSON.stringify({"role" : [new_authority]})
                        const verifyUser = await Admin.update({
                            authority: new_role
                        },{
                            where:{
                                id: admin_id
                            }
                        })

                        if(verifyUser[0] > 0){
                            res.json({response: "success", message: "User verified"})
                        }else{
                            res.json({response: "error", message: "User not verified!"})
                        }
                    }else{
                        res.json({response: "error", message: "This user is already verified"});
                    }
                }else{
                    res.json({response: "error", message: "User not found"})
                }
            })
        } catch (error) {
            console.log(error)
            res.json({response: "error", message: "undefined error occured.", error: [error]})
        }
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
            res.send({"response": "error", "message" : "Undefined error occured!"});
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


    //Soft delete and activate
    access_control : async(req, res) => {
        const  { id } = req.params;
        const is_deleted = req.body.is_deleted;
        const authority = JSON.stringify(req.body.authority);
        try {
            const admin = await Admin.update({
                authority: authority,
                is_deleted : is_deleted
            },
            {
                where: {
                    id: id
                }
            })
            if(admin[0] > 0)
                res.send({"response": "success", "message" : "Successfully updated."})
            else
                res.send({"response": "error", "message" : "Sorry, failed to update!"})
        } catch(error) {
            res.send({"response": "error", "message" : "Undefined error occured!"});                      
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
            if(admin > 0)
                res.send({"response": "success", "message" : "Successfully deleted."})
            else
                res.send({"response" : "error", "message" : "Sorry, failed to delete!"})
        } catch(error) {
            res.send({"response": "error", "message" : "Undefined error occured!"});                     
        }
    }
}