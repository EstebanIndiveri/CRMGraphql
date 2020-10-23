const { ApolloServer } = require("apollo-server");
const conectarDB = require("./config/db");
const resolvers = require("./db/resolvers");
const typeDefs = require("./db/schema");
const jwt=require('jsonwebtoken');
require('dotenv').config({path:'variables.env'});

//connectDB
conectarDB();

//server
const server=new ApolloServer({
    typeDefs,
    resolvers,
    context:({req})=>{
        // console.log(req.headers['authorization']);
        const token=req.headers['authorization']||'';
        if(token){
            try {
                const usuario=jwt.verify(token,process.env.SECRET_KEYJWT)
                // console.log(usuario);
                return{
                    usuario
                }
                
            } catch (error) {
                console.log(error);
            }
        }
    }
   
});

//arranca server
server.listen({port:process.env.PORT || 4000}).then(({url})=>{
    console.log(`Servidor corriendo en ${url}`);
})