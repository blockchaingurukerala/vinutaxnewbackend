const express=require('express');
const UserData = require('./src/model/Userdata');
const Category = require('./src/model/Category');
const ExpenceCategory = require('./src/model/ExpenceCtegory');
const HmrcUpload=require('./src/model/HmrcUpload');
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
   
     UserData.find({userEmailId:userEmailId}).select('userPassword userFullName -_id').then((pwd)=>{
      
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
            
            res.send({"msg":"Database Error"});
        } 
        else{ 
         
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
app.post('/checkHmrcUploaded',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var userEmailId=req.body.userEmailId; 
    var year=req.body.year;
    var quarter=req.body.quarter;
    HmrcUpload.find({userEmailId:userEmailId,year:year,quarter:quarter}, function (err, docs) {
        if (docs.length){            
            res.send({"msg":"Already Uploaded"});
        }else{
            res.send({"msg":"Not Uploaded"});
        }
    });    
});
app.post('/hmrcUploaded',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    
    var hmrcuploaded = {       
        userEmailId : req.body.userEmailId,
        year : req.body.year,
        quarter: req.body.quarter        
   }       
   var hmrc = new HmrcUpload(hmrcuploaded);
   hmrc.save(function(err,result){ 
        if (err){ 
           
            res.send({"msg":"Database Error"});
        } 
        else{             
            res.send({"msg":"Successfully Inserted"});
        } 
    }) ;   
});
app.post('/getIncomeID',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email; 
     UserData.find({userEmailId:email}, function (err, docs) {
        if(docs[0].incomes){
          
            if (docs[0].incomes.length){ 
                var len= docs[0].incomes.length;  
                var id=  docs[0].incomes[len-1].id  
                id++;         
                res.send({"len":id});
            }else{
                res.send({"len":"0"});
            }
        }
        else{
           
            res.send({"len":"0"}); 
        }
      
    }); 
   
});

app.post('/getExpenceID',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email; 
     UserData.find({userEmailId:email}, function (err, docs) {
        if(docs[0].expences){           
            if (docs[0].expences.length){ 
                var len= docs[0].expences.length;  
                var id=  docs[0].expences[len-1].id  
                id++;    
                res.send({"len":id});
            }else{
                res.send({"len":"0"});
            }
        }
        else{
         
            res.send({"len":"0"}); 
        }
      
    }); 
   
});

app.post('/modifyIncomes',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email;         
     var originalincomes=req.body.originalincomes;  
     var modifiedincomes=req.body.modifiedincomes;  
     var flag=0;
     modifiedincomes.forEach(income => {
        UserData.updateOne({userEmailId:email,'incomes.id': income.id}, {'$set': {
            'incomes.$.category':income.category ,
            'incomes.$.description':income.description ,
            'incomes.$.amount':income.amount ,
            'incomes.$.date':income.date             
        }}, function(err, doc){
            if (err) {
                flag=1;                
            }           
        });
        //delete the remaining
        for(var i=0;i<originalincomes.length;i++){
            if(originalincomes[i].id==income.id){
                originalincomes.splice(i,1);
                i--;    
            }
        }      
     });
     originalincomes.forEach(element => {
        UserData.updateOne({userEmailId:email,'incomes.id': element.id},{                
            $pull: { "incomes": {id: element.id } }
        },
        function(err, doc){
            if (err) {flag=2;}
            else{ }
        });
    });
     if(flag==0){
        res.send({"msg":"Updated"});
     }
     else if(flag==1){
        res.send({"msg":"Error in updating"});
     }
     else{
        res.send({"msg":"Error in deleting"});
     }
});

app.post('/modifyExpences',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email;         
     var originalexpences=req.body.originalexpences;  
     var modifiedexpences=req.body.modifiedexpences;  
     var flag=0;

     modifiedexpences.forEach(expence => {
        UserData.updateOne({userEmailId:email,'expences.id': expence.id}, {'$set': {
            'expences.$.category':expence.category ,
            'expences.$.description':expence.description ,
            'expences.$.amount':expence.amount ,
            'expences.$.date':expence.date             
        }}, function(err, doc){
            if (err) {
                flag=1;                
            }           
        });
         //delete the remaining
         for(var i=0;i<originalexpences.length;i++){
            if(originalexpences[i].id==expence.id){
                originalexpences.splice(i,1);
                i--;    
            }
        } 
     });
     originalexpences.forEach(element => {
        UserData.updateOne({userEmailId:email,'expences.id': element.id},{                
            $pull: { "expences": {id: element.id } }
        },
        function(err, doc){
            if (err) {flag=2;}
            else{ }
        });
    });
    if(flag==0){
        res.send({"msg":"Updated"});
     }
     else if(flag==1){
        res.send({"msg":"Error in updating"});
     }
     else{
        res.send({"msg":"Error in deleting"});
     }
});
app.listen(process.env.PORT ||3000, function(){
    console.log('listening to port 3000');
});

