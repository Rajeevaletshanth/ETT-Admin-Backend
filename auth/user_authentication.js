const jwt = require('jsonwebtoken');
require('dotenv').config();

const userAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null){
        return res.sendStatus(401);
    }else{
        jwt.verify(token, process.env.SUPERADMIN_ACCESS_TOKEN_SECRET, (err, user) => {
            if(user){
                req.user = user;
                next()
            }else{
                jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET, (err, user) => {
                    if(err){
                        return res.sendStatus(403);
                    } 
                    req.user = user;
                    next()
                })
            }
        })        
    }
}

const generateUserAccessToken = (user, signedIn) => {
    if(!signedIn){
        return jwt.sign(user, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: "1h"});
    }else{
        return jwt.sign(user, process.env.USER_ACCESS_TOKEN_SECRET, { expiresIn: "24h"});
    }
}



module.exports= {userAuthenticateToken, generateUserAccessToken}