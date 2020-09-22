const { ApolloServer } = require("apollo-server");
const conectarDB = require("./config/db");
const resolvers = require("./db/resolvers");
const typeDefs = require("./db/schema");

//connectDB
conectarDB();

//server
const server=new ApolloServer({
    typeDefs,
    resolvers
   
});

//arranca server
server.listen().then(({url})=>{
    console.log(`Servidor corriendo en ${url}`);
})