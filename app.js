const express=require('express');
const UserData = require('./src/model/Userdata');
const AdminData = require('./src/model/AdminData');
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
app.listen(process.env.PORT ||3000, function(){
    console.log('listening to port 3000');
});

