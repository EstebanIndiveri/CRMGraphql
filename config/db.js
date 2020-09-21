const mongoose = require("mongoose");

require('dotenv').config({path:'variables.env'});

const conectarDB=async()=>{
    try {
        await mongoose.connect(process.env.DB_MONGO,{
            useUnifiedTopology: true, 
            useNewUrlParser: true, 
            useCreateIndex: true,
            useFindAndModify:false
        });
        console.log('DB conectada');
    } catch (error) {
        console.log('hubo un error');
        console.log(error);
        process.exit(1);
    }
}
module.exports=conectarDB;