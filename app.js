const express=require('express');
const UserData = require('./src/model/Userdata');
const Category = require('./src/model/Category');
const ExpenceCategory = require('./src/model/ExpenceCtegory');
var app=new express();
var bodyParser=require('body-parser');
const cors=require('cors');
app.use(cors());
app.use(bodyParser.json());
app.get('/testdeploy',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    console.log("Test deploy.....");    
    res.send("Successfully BackEnd Deployed");
});
app.post('/checkAvailability',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var userEmailId=req.body.userEmailId; 
    UserData.find({userEmailId:userEmailId}, function (err, docs) {
        if (docs.length){
            
            res.send({"msg":"Already Registered"});
        }else{
            res.send({"msg":"Email Available"});
        }
    });    
});
app.post('/authenticate',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var userEmailId=req.body.userEmailId;      
    console.log(userEmailId)
     UserData.find({userEmailId:userEmailId}).select('userPassword userFullName -_id').then((pwd)=>{
        console.log(pwd);
        res.send(pwd);
     });
    // UserData.find({userEmailId:userEmailId,userPassword:password}, function (err, docs) {
    //     if (docs.length){  
    //         //console.log(docs) ;         
    //         res.send({"msg":"success"},{"userFullName":docs.userFullName});
    //     }else{
    //         res.send({"msg":"failed"});  
    //     }
    // });
});
app.post('/insert',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    
    var user = {       
        userFullName : req.body.userFullName,
        userEmailId : req.body.userEmailId,
        userPassword: req.body.userPassword        
   }       
   var user = new UserData(user);
    user.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{ 
            console.log(result) ;
            res.send({"msg":"Successfully Inserted"});
        } 
    }) ;
   
});

app.post('/checkAvailabilityCategory',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var category=req.body.category; 
    Category.find({category:category}, function (err, docs) {
        if (docs.length){            
            res.send({"msg":"Not Available"});
        }else{
            res.send({"msg":"Available"});
        }
    });    
});
app.post('/checkAvailabilityExpenceCategory',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var category=req.body.category; 
    ExpenceCategory.find({category:category}, function (err, docs) {
        if (docs.length){            
            res.send({"msg":"Not Available"});
        }else{
            res.send({"msg":"Available"});
        }
    });    
});
app.post('/insertNewCategory',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    
    var newcategory = {       
        category : req.body.category               
   }       
   var categorynew = new Category(newcategory);
   categorynew.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{ 
            console.log(result) ;
            res.send({"msg":"Successfully Inserted"});
        } 
    }) ;   
});
app.post('/insertNewExpenceCategory',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    
    var newcategory = {       
        category : req.body.category               
   }       
   var categorynew = new ExpenceCategory(newcategory);
   categorynew.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{ 
            console.log(result) ;
            res.send({"msg":"Successfully Inserted"});
        } 
    }) ;   
});
app.get('/getCategories',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    Category.find({}, function (err, docs) {
        if (docs.length){            
            res.send(docs);
        }else{
            res.send({"msg":"Available"});
        }
    });    
});
app.get('/getExpenceCategories',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    ExpenceCategory.find({}, function (err, docs) {
        if (docs.length){            
            res.send(docs);
        }else{
            res.send({"msg":"Available"});
        }
    });    
});
app.post('/updateIncomes',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email;         
     var incomes=req.body.incomes;  
     console.log(incomes);  
    UserData.updateOne({userEmailId:email},{
        $push: {"incomes": {$each: incomes}} 
    },
    function(err, doc){
        if (err) {console.log(err);res.send({"msg":"Error in updating"});}
        else{ res.send({"msg":"Updated"});}
    });
   
});
app.post('/updateExpences',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email;         
     var expences=req.body.expences;  
     console.log(expences);  
    UserData.updateOne({userEmailId:email},{
        $push: {"expences": {$each: expences}} 
    },
    function(err, doc){
        if (err) {console.log(err);res.send({"msg":"Error in updating"});}
        else{ res.send({"msg":"Updated"});}
    });   
});
app.post('/getIncomesExpence',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var email=req.body.email;    
    UserData.find({userEmailId:email}, function (err, docs) {
        if (docs.length){            
            res.send(docs);
        }else{
            res.send({"msg":"Available"});
        }
    });    
});

app.listen(process.env.PORT ||3000, function(){
    console.log('listening to port 3000');
});

