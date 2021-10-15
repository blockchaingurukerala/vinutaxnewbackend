const express=require('express');
const UserData = require('./src/model/Userdata');
const Category = require('./src/model/Category');
const ExpenceCategory = require('./src/model/ExpenceCtegory');
const HmrcUpload=require('./src/model/HmrcUpload');

const CustomerDetails=require('./src/model/CustomerDetails');
const SupplierDetails=require('./src/model/SupplierDetails');

const CustomerInvoice=require('./src/model/CustomerInvoice');
const SupplierInvoice=require('./src/model/SupplierInvoice');

const CustomerInvoiceDraft=require('./src/model/CustomerInvoiceDraft');
const SupplierInvoiceDraft=require('./src/model/SupplierInvoiceDraft');

const CashAccount=require('./src/model/CashAccount');

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

// app.use(cors(options));

//For HMRC connection
const { AuthorizationCode } = require('simple-oauth2');
const request = require('superagent');
const dateFormat = require('dateformat');
const winston = require('winston');
// app.set('view engine', 'ejs');
//for HMRC connection
const clientId = 'hdrHzVkGkTHlhdYIQsVybtb17291';
const clientSecret = '927726f2-cb72-43a9-af51-dedee01f7331';
const serverToken = 'SERVER_TOKEN_HERE';
const apiBaseUrl = 'https://test-api.service.hmrc.gov.uk/';
const serviceName = 'hello';
const serviceVersion = '1.0';
const unRestrictedEndpoint = '/world';
const appRestrictedEndpoint = '/application';
const userRestrictedEndpoint = '/user';
//const oauthScope = 'hello';
const oauthScope = 'read:self-assessment';


// app.get('/',function(req,res){
//     res.sendFile(path.join(__dirname+'/dist/tax/index.html'))
// });

const log = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        timestamp: () => dateFormat(Date.now(), "isoDateTime"),
        formatter: (options) => `${options.timestamp()} ${options.level.toUpperCase()} ${options.message ? options.message : ''}
            ${options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta) : ''}`
      })
    ]
  });

const redirectUri = 'http://localhost:3000/oauth20/callback';                 
//const redirectUri = 'http://localhost:4200/report';   
const cookieSession = require('cookie-session');
app.use(cookieSession({
    name: 'session',
    keys: ['oauth2Token', 'caller'],
    maxAge: 10 * 60 * 60 * 1000 // 10 hours
  }));
  const client = new AuthorizationCode({
    client: {
      id: clientId,
      secret: clientSecret,
    },
    auth: {
      tokenHost: apiBaseUrl,
      tokenPath: '/oauth/token',
      authorizePath: '/oauth/authorize',
    },
  });
  const authorizationUri = client.authorizeURL({
    redirect_uri: redirectUri,
    scope: oauthScope,
  });

  // Call a user-restricted endpoint
app.get("/userCall", (req, res) => {    
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    if (req.session.oauth2Token) {
      var accessToken = client.createToken(req.session.oauth2Token);  
      //log.info('Using token from session: ', accessToken.token);
        //console.log('Using token from session: ', accessToken.token);
      callApi(userRestrictedEndpoint, res, accessToken.token.access_token);
    } else {
      console.log('Redirect to HMRC page: ',req.session.oauth2Token)
      req.session.caller = '/userCall';
      //console.log(authorizationUri)
      res.redirect(authorizationUri);
    }
  });

  // Callback service parsing the authorization token and asking for the access token

app.get('/oauth20/callback', async (req, res) => {
    const { code } = req.query;
    const options = {
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    };
  
    try {
      const accessToken = await client.getToken(options);
        console.log("response back to client......");
      req.session.oauth2Token = accessToken;  
      //console.log(req.session.caller)
      return res.redirect(req.session.caller);
    } catch(error) {
      return res.status(500).json('Authentication failed');
    }
  });

  // Helper functions
function callApi(resource, res, bearerToken) {
    
    const acceptHeader = `application/vnd.hmrc.${serviceVersion}+json`;
    //const url = apiBaseUrl + serviceName + resource;
    const url = apiBaseUrl +"/individuals/calculations/CL670073B/self-assessment";
    //log.info(`Calling ${url} with Accept: ${acceptHeader}`);
    const req = request
      .get(url)
      .accept(acceptHeader);
    if(bearerToken) {
      log.info('Using bearer token:', bearerToken);
      req.set('Authorization', `Bearer ${bearerToken}`);
    }
    req.end((err, apiResponse) => handleResponse(res, err, apiResponse));
  }

  function handleResponse(res, err, apiResponse) {
    if (err || !apiResponse.ok) {
      log.error('Handling error response: ', err);
      res.send(err);
    } else {
        //console.log(apiResponse.body)
        //res.send(apiResponse.body);
        res.redirect("http://localhost:4200/displayfromhmrc"+"/?str="+JSON.stringify(apiResponse.body));
    }
  };

app.get('/testdeploy',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    //console.log("Test deploy.....");    
    res.send({"msg":"Successfully deployed"});
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
   Category.find({category:req.body.category}, function (err, docs) {
        if (docs.length){            
            res.send({"msg":"Category Exists"});
        }else{
            categorynew.save(function(err,result){ 
                if (err){             
                    res.send({"msg":"Database Error"});
                } 
                else{          
                    res.send({"msg":"Successfully Inserted"});
                } 
            }) ; 
           
        }
    });   
 
});
app.post('/insertNewExpenceCategory',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
    
    var newcategory = {       
        category : req.body.category               
   }       
   var categorynew = new ExpenceCategory(newcategory);
   ExpenceCategory.find({category:req.body.category}, function (err, docs) {
        if (docs.length){            
            res.send({"msg":"Category Exists"});
        }else{
            categorynew.save(function(err,result){ 
                if (err){             
                    res.send({"msg":"Database Error"});
                } 
                else{          
                    res.send({"msg":"Successfully Inserted"});
                } 
            }) ; 
        
        }
    }); 
  
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
// app.post('/updateIncomes',function(req,res){
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
//      var email=req.body.email;         
//      var incomes=req.body.incomes;     
//     UserData.updateOne({userEmailId:email},{
//         $push: {"incomes": {$each: incomes}} 
//     },
//     function(err, doc){
//         if (err) {console.log(err);res.send({"msg":"Error in updating"});}
//         else{ res.send({"msg":"Updated"});}
//     });
   
// });
app.post('/updateIncomes',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email;         
     var incomes=req.body.incomes;     
    UserData.updateOne({userEmailId:email},{
        $push: {"incomes":incomes} 
    },
    function(err, doc){
        if (err) {console.log(err);res.send({"msg":"Error in updating"});}
        else{ res.send({"msg":"Updated"});}
    });
   
});
// app.post('/updateExpences',function(req,res){
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
//      var email=req.body.email;         
//      var expences=req.body.expences;  
      
//     UserData.updateOne({userEmailId:email},{
//         $push: {"expences": {$each: expences}} 
//     },
//     function(err, doc){
//         if (err) {console.log(err);res.send({"msg":"Error in updating"});}
//         else{ res.send({"msg":"Updated"});}
//     });   
// });
app.post('/updateExpences',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');    
     var email=req.body.email;         
     var expences=req.body.expences;  
      
    UserData.updateOne({userEmailId:email},{
        $push: {"expences": expences} 
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
         if(err){
         }
        else if(docs[0].incomes){
          
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
app.post('/addCustomerDetils',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var user = {       
        userFullName : req.body.name,
        userEmailId : req.body.email,
        userContactNo: req.body.contactno ,
        userAddress: req.body.address  ,
        userWhose: req.body.whose        
   }       
   var user = new CustomerDetails(user);
//    CustomerDetails.find({userEmailId:req.body.email,userWhose:req.body.whose}, function (err, docs) {
//         if (docs.length){            
//             res.send({"msg":docs[0]._id});            

//         }else{
            user.save(function(err,result){ 
                if (err){ 
                    //console.log(err); 
                    res.send({"msg":"Database Error"});
                } 
                else{    
                    //console.log()
                   res.send({"msg":result._id});
                } 
            }) ;
    //     }
    // }); 
});
app.post('/addSupplierDetils',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var user = {       
        userFullName : req.body.name,
        userEmailId : req.body.email,
        userContactNo: req.body.contactno ,
        userAddress: req.body.address  ,
        userWhose: req.body.whose        
   }       
   var user = new SupplierDetails(user);
//    SupplierDetails.find({userEmailId:req.body.email,userWhose:req.body.whose}, function (err, docs) {
//         if (docs.length){            
//             res.send({"msg":docs[0]._id});            

//         }else{
            user.save(function(err,result){ 
                if (err){ 
                   // console.log(err); 
                    res.send({"msg":"Database Error"});
                } 
                else{    
                    //console.log()
                   res.send({"msg":result._id});
                } 
            }) ;
    //     }
    // }); 
});
app.post('/addCustomerInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var invoice = {       
        date : req.body.date,
        duedate : req.body.duedate,
        invoiceid: req.body.invoiceid ,
        reference: req.body.reference  ,
        products: req.body.products ,
        totalamount: req.body.totalamount  ,       
        additionaldetails: req.body.additionaldetails  ,
        whose: req.body.whose  ,
        customerid: req.body.customerid  ,
        count:0  ,
        customername:req.body.customername,
        allocatedDetails:[],
        allocatedAmount:0,
        allocated:false      
   }       
    var invoice = new CustomerInvoice(invoice);
    invoice.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{            
            var findQuery = CustomerInvoice.find({whose:req.body.whose}).sort({count : -1}).limit(1);
            
            findQuery.exec(function(err, maxResult){
                if (err) { res.send({"msg":"Error in Creating Invoice Number"});}
                else { 
                    if(maxResult.length>0) {
                        CustomerInvoice.updateMany({whose:req.body.whose}, 
                            {count:maxResult[0].count+1}, function (err, docs) {
                            if (err){
                                res.send({"msg":"Error in Creating Invoice Number"});
                            }
                            else{
                                CustomerInvoiceDraft.updateMany({whose:req.body.whose}, 
                                    {count:maxResult[0].count+1}, function (err, docs) {
                                    if (err){
                                        res.send({"msg":"Error in Creating Invoice Number"});
                                    }
                                    else{                                        
                                        res.send({"msg":"Successfully Saved"});
                                    }
                                });   
                            }
                        });
                    }
                    else{

                        CustomerInvoice.updateMany({whose:req.body.whose}, 
                            {count:1}, function (err, docs) {
                            if (err){
                                res.send({"msg":"Error in Creating Invoice Number"});
                            }
                            else{
                                CustomerInvoiceDraft.updateMany({whose:req.body.whose}, 
                                    {count:1}, function (err, docs) {
                                    if (err){
                                        res.send({"msg":"Error in Creating Invoice Number"});
                                    }
                                    else{                                        
                                        res.send({"msg":"Successfully Saved"});
                                    }
                                });   
                            }
                        });
                    }
                }
            });
               
        } 
    }) ;
});
app.post('/addSupplierInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var invoice = {       
        date : req.body.date,
        duedate : req.body.duedate,
        invoiceid: req.body.invoiceid ,
        reference: req.body.reference  ,
        products: req.body.products ,
        totalamount: req.body.totalamount  ,       
        additionaldetails: req.body.additionaldetails  ,
        whose: req.body.whose  ,
        customerid: req.body.customerid  ,
        count:0  ,
        customername:req.body.customername   ,
        allocatedDetails:[],
        allocatedAmount:0,
        allocated:false        
   }       
    var invoice = new SupplierInvoice(invoice);
    invoice.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{            
            res.send({"msg":"Successfully Saved"});               
        } 
    }) ;
});
app.post('/addCustomerInvoiceDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var invoice = {       
        date : req.body.date,
        duedate : req.body.duedate,
        invoiceid: req.body.invoiceid ,
        reference: req.body.reference  ,
        products: req.body.products ,
        totalamount: req.body.totalamount  ,       
        additionaldetails: req.body.additionaldetails  ,
        whose: req.body.whose  ,
        customerid: req.body.customerid  ,
        count:0    ,
        customername:req.body.customername ,
        allocatedDetails:[],
        allocatedAmount:0,
        allocated:false       
   }       
    var invoice = new CustomerInvoiceDraft(invoice);
    invoice.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{            
            var findQuery = CustomerInvoice.find({whose:req.body.whose}).sort({count : -1}).limit(1);
            findQuery.exec(function(err, maxResult){
                if (err) { res.send({"msg":"Error in Creating Invoice Number"});}
                else { 
                    if(maxResult.length>0) {
                        CustomerInvoice.updateMany({whose:req.body.whose}, 
                            {count:maxResult[0].count+1}, function (err, docs) {
                            if (err){
                                res.send({"msg":"Error in Creating Invoice Number"});
                            }
                            else{
                                CustomerInvoiceDraft.updateMany({whose:req.body.whose}, 
                                    {count:maxResult[0].count+1}, function (err, docs) {
                                    if (err){
                                        res.send({"msg":"Error in Creating Invoice Number"});
                                    }
                                    else{                                        
                                        res.send({"msg":"Successfully Saved"});
                                    }
                                });                               
                            }
                        });

                    }
                    else{

                        CustomerInvoice.updateMany({whose:req.body.whose}, 
                            {count:1}, function (err, docs) {
                            if (err){
                                res.send({"msg":"Error in Creating Invoice Number"});
                            }
                            else{
                                CustomerInvoiceDraft.updateMany({whose:req.body.whose}, 
                                    {count:1}, function (err, docs) {
                                    if (err){
                                        res.send({"msg":"Error in Creating Invoice Number"});
                                    }
                                    else{                                        
                                        res.send({"msg":"Successfully Saved"});
                                    }
                                });   
                            }
                        });
                    }
                }
            });
               
        } 
    }) ;
});
app.post('/addSupplierInvoiceDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var invoice = {       
        date : req.body.date,
        duedate : req.body.duedate,
        invoiceid: req.body.invoiceid ,
        reference: req.body.reference  ,
        products: req.body.products ,
        totalamount: req.body.totalamount  ,       
        additionaldetails: req.body.additionaldetails  ,
        whose: req.body.whose  ,
        customerid: req.body.customerid  ,
        count:0 ,
        customername:req.body.customername   ,
        allocatedDetails:[],
        allocatedAmount:0,
        allocated:false         
   }       
    var invoice = new SupplierInvoiceDraft(invoice);
    invoice.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{            
            res.send({"msg":"Successfully Saved"});               
        } 
    }) ;
});
app.post('/createNextCustomerInvoiceNumber',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    var findQuery = CustomerInvoice.find({whose:req.body.whose}).sort({count : -1}).limit(1);
    findQuery.exec(function(err, maxResult){
        if (err) { res.send({"msg":"Error in Creating Invoice Number"});}
        else { 
            if(maxResult.length>0) {
                if( maxResult[0].count){
                    res.send({"msg":"INV-0"+(maxResult[0].count+1)});               
                }
                else{
                    res.send({"msg":"INV-01"});                           
                } 
            }  
            else{
                res.send({"msg":"INV-01"});   
            }        
                             
        }
    });
});
app.post('/getAllCustomers',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerDetails.find({userWhose:req.body.whose}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllSuppliers',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierDetails.find({userWhose:req.body.whose}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllCustomerInvoioce',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoice.find({whose:req.body.whose}, function (err, docs) {
       res.send(docs);
    });  
});


app.post('/allocateToCustomerInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
   
    CustomerInvoice.updateOne({whose:req.body.whose,_id:req.body.id},{
        $push: {"allocatedDetails":{"date":req.body.date,"allocatedAmount":req.body.allocatedAmount}},
         $inc: { allocatedAmount: req.body.allocatedAmount } 
    } 
    ,
    function(err, doc){
 
        if (err) {console.log(err);res.send({"msg":"Error in updating"});}
        else{ 
            CustomerInvoice.updateMany({whose:req.body.whose,_id:req.body.id,allocatedAmount:req.body.totalamount},{
                allocated:true
             },
             function(err, doc){
                 if (err) {console.log(err);res.send({"msg":"Error in updating"});}
                 else{ res.send({"msg":"Updated"});}
             });           
        }
    });
});
app.post('/allocateToSupplierInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
   
    SupplierInvoice.updateOne({whose:req.body.whose,_id:req.body.id},{
        $push: {"allocatedDetails":{"date":req.body.date,"allocatedAmount":req.body.allocatedAmount}},
         $inc: { allocatedAmount: req.body.allocatedAmount } 
    } 
    ,
    function(err, doc){
       
        if (err) {console.log(err);res.send({"msg":"Error in updating"});}
        else{ 
            SupplierInvoice.updateMany({whose:req.body.whose,_id:req.body.id,allocatedAmount:req.body.totalamount},{
                allocated:true
             },
             function(err, doc){
                 if (err) {console.log(err);res.send({"msg":"Error in updating"});}
                 else{ res.send({"msg":"Updated"});}
             });           
        }
    });
});

app.post('/getAllCustomerInvoioceUnallocated',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoice.find({whose:req.body.whose,allocated:false,totalamount:{$gt:0}}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllSupplierNegativeInvoioceUnallocated',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoice.find({whose:req.body.whose,allocated:false,totalamount:{$lt:0}}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllSupplierInvoioceUnallocated',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoice.find({whose:req.body.whose,allocated:false,totalamount:{$gt:0}}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllCustomerNegativeInvoioceUnallocated',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoice.find({whose:req.body.whose,allocated:false,totalamount:{$lt:0}}, function (err, docs) {
       res.send(docs);
    });      
});

app.post('/getAllSupplierInvoioce',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoice.find({whose:req.body.whose}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllCustomerDraftInvoioce',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoiceDraft.find({whose:req.body.whose}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllSupplierDraftInvoioce',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoiceDraft.find({whose:req.body.whose}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getCustomerNameFromId',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerDetails.find({_id:req.body.id}, function (err, docs) { 
        if (err)   {
            console.log(err);
        }    
        else{
            res.send({"name":docs[0].userFullName});            
        }       
    });  
});
app.post('/getSupplierNameFromId',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierDetails.find({_id:req.body.id}, function (err, docs) {        
        res.send({"name":docs[0].userFullName});
    });  
});
app.post('/getCustomerInvoioceFromId',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoice.find({_id:req.body.id}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getSupplierInvoioceFromId',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoice.find({_id:req.body.id}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getDraftCustomerInvoioceFromId',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoiceDraft.find({_id:req.body.id}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getDraftSupplierInvoioceFromId',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoiceDraft.find({_id:req.body.id}, function (err, docs) {
       res.send(docs);
    });  
});

app.post('/updteCustomerInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;
    var date = req.body.date;
    var duedate = req.body.duedate;
    var invoiceid= req.body.invoiceid;
    var reference= req.body.reference;
    var products=req.body.products;
    var totalamount= req.body.totalamount;       
    var additionaldetails=req.body.additionaldetails;
    CustomerInvoice.updateOne({_id :id}, 
        {date:date,duedate:duedate,invoiceid:invoiceid,reference:reference,products:products,totalamount:totalamount,additionaldetails:additionaldetails}, function (err, docs) {
        if (err){
            res.send({"msg":"Database Error"});
        }
        else{
            res.send({"msg":"successfully Updated"});
        }
    });
});
app.post('/updteSupplierInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;
    var date = req.body.date;
    var duedate = req.body.duedate;
    var invoiceid= req.body.invoiceid;
    var reference= req.body.reference;
    var products=req.body.products;
    var totalamount= req.body.totalamount;       
    var additionaldetails=req.body.additionaldetails;
    SupplierInvoice.updateOne({_id :id}, 
        {date:date,duedate:duedate,invoiceid:invoiceid,reference:reference,products:products,totalamount:totalamount,additionaldetails:additionaldetails}, function (err, docs) {
        if (err){
            res.send({"msg":"Database Error"});
        }
        else{
            res.send({"msg":"successfully Updated"});
        }
    });
});
app.post('/updteCustomerInvoiceDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;
    var date = req.body.date;
    var duedate = req.body.duedate;
    var invoiceid= req.body.invoiceid;
    var reference= req.body.reference;
    var products=req.body.products;
    var totalamount= req.body.totalamount;       
    var additionaldetails=req.body.additionaldetails;
    CustomerInvoiceDraft.updateOne({_id :id}, 
        {date:date,duedate:duedate,invoiceid:invoiceid,reference:reference,products:products,totalamount:totalamount,additionaldetails:additionaldetails}, function (err, docs) {
        if (err){
            res.send({"msg":"Database Error"});
        }
        else{
            res.send({"msg":"successfully Updated"});
        }
    });
});
app.post('/updteSupplierInvoiceDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;
    var date = req.body.date;
    var duedate = req.body.duedate;
    var invoiceid= req.body.invoiceid;
    var reference= req.body.reference;
    var products=req.body.products;
    var totalamount= req.body.totalamount;       
    var additionaldetails=req.body.additionaldetails;
    SupplierInvoiceDraft.updateOne({_id :id}, 
        {date:date,duedate:duedate,invoiceid:invoiceid,reference:reference,products:products,totalamount:totalamount,additionaldetails:additionaldetails}, function (err, docs) {
        if (err){
            res.send({"msg":"Database Error"});
        }
        else{
            res.send({"msg":"successfully Updated"});
        }
    });
});
app.post('/deleteCustomerInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;    
    CustomerInvoice.deleteMany({_id :id}, function (err, _) {
        if (err) {
            res.send({"msg":"Error while Deleting...Pls Try after some time"});
        }
        else{
            res.send({"msg":"Deleted Successfully"});
        }
    });
});
app.post('/deleteSupplierInvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;    
    SupplierInvoice.deleteMany({_id :id}, function (err, _) {
        if (err) {
            res.send({"msg":"Error while Deleting...Pls Try after some time"});
        }
        else{
            res.send({"msg":"Deleted Successfully"});
        }
    });
});
app.post('/deleteCustomerInvoiceFromDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;    
    CustomerInvoiceDraft.deleteMany({_id :id}, function (err, _) {
        if (err) {
            res.send({"msg":"Error while Deleting...Pls Try after some time"});
        }
        else{
            res.send({"msg":"Deleted Successfully"});
        }
    });
});
app.post('/deleteSupplierInvoiceFromDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;    
    SupplierInvoiceDraft.deleteMany({_id :id}, function (err, _) {
        if (err) {
            res.send({"msg":"Error while Deleting...Pls Try after some time"});
        }
        else{
            res.send({"msg":"Deleted Successfully"});
        }
    });
});
app.post('/aprovedraftinvoice',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;    
    CustomerInvoiceDraft.find({_id:id},function(err,data){    
        var invoice = {       
            date : data[0].date,
            duedate : data[0].duedate,
            invoiceid: data[0].invoiceid ,
            reference: data[0].reference  ,
            products: data[0].products ,
            totalamount: data[0].totalamount  ,       
            additionaldetails: data[0].additionaldetails  ,
            whose: data[0].whose  ,
            customerid: data[0].customerid  ,
            customername:data[0].customername,
            count:data[0].count,
            allocatedDetails:data[0].allocatedDetails,
            allocatedAmount:data[0].allocatedAmount,
            allocated:data[0].allocated      
       }    
        var invoice = new CustomerInvoice(invoice);
        invoice.save(function(err,result){ 
            if(err){
                res.send({"msg":"Error while Deleting...Pls Try after some time"});
            }
            else{
                    CustomerInvoiceDraft.deleteMany({_id :id}, function (err, _) {
                        if (err) {
                            res.send({"msg":"Error while Deleting...Pls Try after some time"});
                        }
                        else{
                            res.send({"msg":"Aproved Successfully"});
                        }
                    });
            }
        });
    });  
});
app.post('/aprovedraftinvoiceSupplier',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;    
    SupplierInvoiceDraft.find({_id:id},function(err,data){    
        var invoice = {       
            date : data[0].date,
            duedate : data[0].duedate,
            invoiceid: data[0].invoiceid ,
            reference: data[0].reference  ,
            products: data[0].products ,
            totalamount: data[0].totalamount  ,       
            additionaldetails: data[0].additionaldetails  ,
            whose: data[0].whose  ,
            customerid: data[0].customerid  ,
            customername:data[0].customername,
            count:data[0].count ,
            allocatedDetails:data[0].allocatedDetails,
            allocatedAmount:data[0].allocatedAmount,
            allocated:data[0].allocated          
       }    
        var invoice = new SupplierInvoice(invoice);
        invoice.save(function(err,result){ 
            if(err){
                res.send({"msg":"Error while Deleting...Pls Try after some time"});
            }
            else{
                    SupplierInvoiceDraft.deleteMany({_id :id}, function (err, _) {
                        if (err) {
                            res.send({"msg":"Error while Deleting...Pls Try after some time"});
                        }
                        else{
                            res.send({"msg":"Aproved Successfully"});
                        }
                    });            }
        });
    });  
});
app.post('/getCustomerDetails',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerDetails.find({_id:req.body.id}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getSupplierDetails',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierDetails.find({_id:req.body.id}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllInvoioceOfACustomer',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoice.find({whose:req.body.whose,customerid:req.body.customerid}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllInvoioceOfASupplier',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoice.find({whose:req.body.whose,customerid:req.body.customerid}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllInvoioceOfACustomerDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    CustomerInvoiceDraft.find({whose:req.body.whose,customerid:req.body.customerid}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/getAllInvoioceOfASupplierDraft',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    SupplierInvoiceDraft.find({whose:req.body.whose,customerid:req.body.customerid}, function (err, docs) {
       res.send(docs);
    });  
});
app.post('/updateCustomer',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;
    var userFullName = req.body.userFullName;
    var userEmailId = req.body.userEmailId;
    var userContactNo= req.body.userContactNo;
    var userAddress= req.body.userAddress;
    CustomerDetails.updateOne({_id :id}, 
        {userFullName:userFullName,userEmailId:userEmailId,userContactNo:userContactNo,userAddress:userAddress}, function (err, docs) {
        if (err){
            res.send({"msg":"Database Error"});
        }
        else{
            res.send({"msg":"successfully Updated"});
        }
    });
});
app.post('/updateSupplier',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;
    var userFullName = req.body.userFullName;
    var userEmailId = req.body.userEmailId;
    var userContactNo= req.body.userContactNo;
    var userAddress= req.body.userAddress;
   
    SupplierDetails.updateOne({_id :id}, 
        {userFullName:userFullName,userEmailId:userEmailId,userContactNo:userContactNo,userAddress:userAddress}, function (err, docs) {
        if (err){
            res.send({"msg":"Database Error"});
        }
        else{
            res.send({"msg":"successfully Updated"});
        }
    });
});
app.post('/deleteCustomer',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;  
    CustomerInvoice.find({customerid:id}, function (err, docs) {
        if (docs.length){            
            res.send({"msg":"Cannot Delete...Invoice available"});            

        }else{ 
            CustomerInvoiceDraft.find({customerid:id}, function (err, docs) {
                if (docs.length){            
                    res.send({"msg":"Cannot Delete ...Draft Invoice available"});
                }else{ 
                    CustomerDetails.deleteMany({_id :id}, function (err, _) {
                        if (err) {
                            res.send({"msg":"Error while Deleting...Pls Try after some time"});
                        }
                        else{
                            res.send({"msg":"Deleted"});
                        }
                    }); 
                } 
            });
        } 
    });   
});
app.post('/deleteSupplier',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var id=req.body.id;  
    SupplierInvoice.find({customerid:id}, function (err, docs) {
        if (docs.length){            
            res.send({"msg":"Cannot Delete...Invoice available"});            

        }else{ 
            SupplierInvoiceDraft.find({customerid:id}, function (err, docs) {
                if (docs.length){            
                    res.send({"msg":"Cannot Delete ...Draft Invoice available"});
                }else{ 
                    SupplierDetails.deleteMany({_id :id}, function (err, _) {
                        if (err) {
                            res.send({"msg":"Error while Deleting...Pls Try after some time"});
                        }
                        else{
                            res.send({"msg":"Deleted"});
                        }
                    }); 
                } 
            });
        } 
    });   
});
app.post('/createNextCashAccountNumber',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');      
    var findQuery = CashAccount.find({whose:req.body.whose}).sort({count : -1}).limit(1);
    findQuery.exec(function(err, maxResult){
        if (err) { res.send({"msg":"Error in Creating CashAccount Number"});}
        else { 
            if(maxResult.length>0) {
                if( maxResult[0].count){
                    res.send({"msg":"CH-0"+(maxResult[0].count+1)});               
                }
                else{
                    res.send({"msg":"CH-01"});                           
                } 
            }  
            else{
                res.send({"msg":"CH-01"});   
            }              
        }
    });
});

app.post('/addCashAccount',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');     
    var cashaccount1 = {      
        cashaccountid : req.body.payment.id,
        date : req.body.payment.date,
        amount: req.body.payment.amount ,
        autoamount:-1*req.body.payment.amount ,
        description: req.body.payment.description  ,
        category: req.body.payment.category ,  
        count:0  ,  
        whose: req.body.whose 
   }          
    var cashaccount = new CashAccount(cashaccount1);    
    cashaccount.save(function(err,result){ 
        if (err){ 
            console.log(err); 
            res.send({"msg":"Database Error"});
        } 
        else{            
            var findQuery = CashAccount.find({whose:req.body.whose}).sort({count : -1}).limit(1);
            findQuery.exec(function(err, maxResult){
                if (err) { res.send({"msg":"Error in updating cashAccount Count Number"});}
                else { 
                    if(maxResult.length>0) {
                        CashAccount.updateMany({whose:req.body.whose}, 
                            {count:maxResult[0].count+1}, function (err, docs) {
                            if (err){
                                res.send({"msg":"Error in updating cashAccount Count Number"});
                            }
                            else{                                 
                                res.send({"msg":"Successfully Saved"});
                            }
                        });
                    }
                    else{
                        CashAccount.updateMany({whose:req.body.whose}, 
                            {count:1}, function (err, docs) {
                            if (err){
                                res.send({"msg":"Error in updating cashAccount Count Number"});
                            }
                            else{                                
                                res.send({"msg":"Successfully Saved"});
                            }
                        });
                    }
                }
            });
               
        } 
    }) ;
});

app.post('/getAllCashAccounts',function(req,res){
    res.header("Access-Control-Allow-Origin", "*")
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS'); 
    var email=req.body.email;    
    CashAccount.find({whose:email}, function (err, docs) {
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
