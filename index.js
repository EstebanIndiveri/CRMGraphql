const { ApolloServer,gql } = require("apollo-server");



//server

const server=new ApolloServer();

//arranca server

server.listen().then(({url})=>{
    console.log(`Servidor corriendo en ${url}`);
})