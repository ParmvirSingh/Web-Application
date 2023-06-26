var express = require('express'),
handlebars = require('express-handlebars').create({defaultLayout: 'main'}),
cookieParser = require('cookie-parser'),
sessions = require('express-session'),
bodyParser = require('body-parser'),
md5 = require('md5');
mongoose = require('mongoose'),
credentials = require('./credentials'),
Users = require('./models/userCredentials');

const dotenv = require('dotenv');
dotenv.config();

var app = express();

mongoose
.connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
.then(() => console.log("DB Connected!"));

mongoose.connection.on('error', (err) => {
    console.log(`DB connection error: ${err.message}`);
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser(credentials.cookieSecret));
app.use(sessions({
    resave: true,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    cookie: {maxAge: 3600000}
}));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 8080);

app.get('/', function(req, res){
    res.render('login');
});

function checklogin(req, res, user, pass){
    if (user.trim() === '' || pass.trim() === '') {
        res.render('login', {message: 'Username and password are required fields. Please try again.'});
    }
    else{
        Users.findOne({username: user}, function(error, user){
            if(error){
                console.log(error);
            }
            
            if(user){
                if(user.password == md5(pass)){
                    req.session.userName = req.body.username;
                    res.redirect(303, 'home');
                }
                else{
                    res.render('login', {message: 'Incorrect password. Please try again.'});
                }
            }
            else{
                res.render('login', {message: 'This username does not exist in the system. Please register as a new user.'});
            }
        });
    }
}

app.post('/processLogin', function(req, res){
    if(req.body.buttonVar == 'login'){
        checklogin(req, res, req.body.username.trim(), req.body.password.trim());
    }
    else{
        res.redirect(303, 'register');
    }
});

app.post('/processReg', function(req, res){
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    const password2 = req.body.password2.trim();
    
    if(password !== password2){
        res.render('register', {message: 'The passwords do not match. Please try again.'});
    }
    else{
        Users.findOne({username: username}, function(error, existingUser){
            if(error){
                console.log(error);
            }
            else if(existingUser){
                res.render('register', {message: 'This username is already registered. Please choose a different username.'});
            }
            else{
                const user = new Users({
                    username: req.body.username,
                    password: md5(req.body.password)
                });
                
                user.save((error, toDB) => {
                    if(error){
                        console.log(error);
                    }
                });
                
                req.session.userName = req.body.username;
                res.redirect(303, 'home');
            }
        });
    }
});

app.get('/home', function(req, res){
    if(req.session.userName){
        res.render('home');
    }
    else{
        res.render('login', {message: 'Please login to access the home page.'});
    }
});

app.get('/page2', function(req, res){
    if(req.session.userName){
        res.render('page2');
    }
    else{
        res.render('login', {message: 'Please login to access the second page.'});
    }
});

app.get('/register', function(req, res){
    res.render('register');
});

app.get('/logout', function(req, res){
    delete req.session.userName;
    res.redirect(303, '/');
});

app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate');
});