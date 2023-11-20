const db = require('../db_connect');
const Upload = require('../models/upload');
const storage = require('../services/multer/uploadFile');
const multer = require('multer');

module.exports = {
    uploadSingle: (req, res) => {
        try {
            let upload = multer({ storage: storage}).single('file');
    
            upload(req, res, function(err) {

                if (!req.file) {
                    return res.send('Please select a file to upload');
                }
                else if (err instanceof multer.MulterError) {
                    return res.send(err);
                }
                else if (err) {
                    return res.send(err);
                }
    
                const classifiedsadd = {
                    file: req.file.filename
                };

                try { 
                    const upload = new Upload(classifiedsadd)
                    upload.save()
                    res.json({ filename: upload.file })
                } catch(error) { 
                    console.error(error)
                }
    
            }); 
    
        }catch (err) {console.log(err)}
    },

    uploadMultiple: (req,res) => {
        try {
            let upload = multer({ storage: storage}).array('files', 10);
    
            upload(req, res, function(err) {

                if (!req.files) {
                    return res.send('Please select a file to upload');
                }
                else if (err instanceof multer.MulterError) {
                    return res.send(err);
                }
                else if (err) {
                    return res.send(err);
                }
                var response = [];
                req.files.map((item,index) => {
                    const classifiedsadd = {
                        file: item.filename
                    };

                    try { 
                        const upload = new Upload(classifiedsadd)
                        upload.save()
                        response.push({ success: true , filename: item.filename})
                    } catch(error) { 
                        console.error(error)
                    }
                })  
                
                res.send(response);
    
            }); 
    
        }catch (err) {console.log(err)}
    },

    getImage : (req, res) => {
        res.download('../server/public/uploads/1660632804460-LTWDentalCare-HomeLayout.png')
    }
}