const express = require('express');
const bodyParser = require('body-parser');
const cookie = require('cookie-parser');
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Email = require('./models/emailModel');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');

const app = express();

app.set('view engine','ejs');
app.listen(8080);

app.use(express.static(__dirname));
app.use(cookie("session"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret:"session",resave:true,saveUninitialized:false}))
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect('mongodb://test:p4$$w0rd@ds046677.mlab.com:46677/email',{ useNewUrlParser: true});

app.get('/',function(req,res){
    res.render('index');
});

app.get('/register',function(req,res){
   res.render("register");
});

app.post("/register", function(req, res){
    User.register(new User({
            name: req.body.name,
            username : req.body.username
        }),
        req.body.password, function(err, user){
            if(err){
                console.log(err);
                return res.render('register');
            }
            passport.authenticate("local")(req, res, function(){
                res.redirect("/inbox");
            });
        });
});

app.post('/login', passport.authenticate('local', { successRedirect: '/inbox',
        failureRedirect: '/' }));

app.get("/inbox",async function(req,res){

    if(req.user)
    {
        let Emails = await Email.find({'to':req.user.username,'deleted':0,'junk':0}).exec();
        console.log(Emails);
        app.locals.inboxTotal = Emails.length;
        app.locals.emails = Emails;
        app.locals.user = req.user;
        res.render("inbox");
    }
    else
    {
        res.redirect("/");
    }
})

app.get("/newEmail",function(req,res){
    if(req.user)
    {
        res.render("compose");
    }
    else
    {
        res.redirect("/");
    }
})

app.post("/newEmail",function(req,res){
    var email = new Email({
        from: req.user.username,
        to: req.body.email_to,
        subject: req.body.email_subject,
        content: req.body.email_content,
        date: Date.now(),
        read: 0,
        junk: 0,
        deleted: 0
    });

    email.save().then(email => {
        console.log("email sent");
    }).catch(err => {
        console.log(err);
    });

    res.render("inbox");
})

app.get("/delete",function(req,res){
    var id = req.params.id;
    Email.updateOne({"_id":id},{$set:{'deleted':1}},function(err, doc){
        if(err) return res.send(500,{error: err});
        console.log(doc);
        res.redirect("/inbox");
    })
})

app.get("/Deleted",async function(req,res){
    if(req.user)
    {
        let DelEmails = await Email.find({'to':req.user.username,'deleted':1}).exec();
        console.log(DelEmails);
        app.locals.del_emails = DelEmails;
        app.locals.user = req.user;
        res.render("deleted");
    }
    else
    {
        res.redirect("/");
    }
})

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});