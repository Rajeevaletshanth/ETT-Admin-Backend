const express = require('express');
const app = express();

var compression = require('compression')
const helmet = require('helmet')
const path = require('path');
const session = require('express-session')
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
// const favicon = require('serve-favicon');

const rateLimit = require("express-rate-limit");
const requestIp = require('request-ip');
const bodyParser = require("body-parser");
const cors = require("cors");


const {authenticateToken, adminAuthenticateToken} = require("./auth/authentication")

require('dotenv').config()



app.use(cors());
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false
}));

app.use(compression());
app.use(helmet());

app.use(function(req, res, next) {
    //disabling cache
    res.setHeader('Surrogate-Control', 'no-store')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    next();
});

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 30, // limit each IP to 30 requests per windowMs
    statusCode: 500, //change this to 200 so the end user will get a custom msg saying server cant handle this much requests
    message: {
        "text": "limit exceeded"
    }
});
//  apply to all api requests
app.use('/api/v1', limiter);

app.use(session({
    secret: 'ASDew5rtfxcvfga',
    resave: false,
    saveUninitialized: true
}));

app.set('superSecret', process.env.SECRET);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //removing public folder form routes acessing
//app.use(express.static('/uploads/'));
/*app.use('/resources',express.static(__dirname + '/images'));*/
// ip request
app.use(requestIp.mw())

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


//Welcome Route
app.get('/validate', authenticateToken, (req, res) => {
    // res.json(req.user)
    res.send({"message" : "Welcome to ETT Engine...", "authenticate" : true})
})

app.get('/superadmin/validate', adminAuthenticateToken, (req, res) => {
    // res.json(req.user)
    res.send({"message" : "Welcome to ETTg Engine...", "authenticate" : true})
})

//Routes
const adminRoute = require('./routes/adminRoute');
const moderatorRoute = require('./routes/moderatorRoute');
const userRoute = require('./routes/userRoute');
const superadminRoute = require('./routes/superadminRoute');
const uploadRoute = require('./routes/uploadRoute');
const cardRoute = require('./routes/cardRoute');
const productRoute = require('./routes/productRoute');
const paymentRoute = require('./routes/paymentRoute');


app.use('/admin', adminRoute);
app.use('/moderator', moderatorRoute);
app.use('/user', userRoute);
app.use('/superadmin', superadminRoute);
app.use('/card', cardRoute);
app.use('/product', productRoute);
app.use('/payment', paymentRoute);

// app.use(authenticateToken, uploadRoute);
app.use(uploadRoute);

app.get('/download/:filename', authenticateToken, (req, res) => {
    const  {filename}  = req.params;
    var file = __dirname + '/public/uploads/' +  filename;
    console.log(file)
    res.download(file);
})

app.get('/getAvatar/:filename', (req, res) => {
    const  {filename}  = req.params;
    var file = __dirname + '/public/uploads/' +  filename;
    console.log(file)
    res.download(file);
})


//Test mail
const testmail = require('./services/nodemailer/test_mail');
app.use(testmail);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        if (process.env.ENV == "production") {
            res.redirect('/500');
        } else {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        }
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    if (process.env.ENV == "production") {
        res.redirect('/500');
    } else {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    }
});


app.listen(process.env.PORT, () => console.log(`ETT engine on live on port ${process.env.PORT}!`))

module.exports = app;