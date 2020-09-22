const Usuario = require("../models/Usuario");
const bcrypt=require('bcryptjs');

//resolver
const resolvers={
    Query:{
        obtenerCurso:()=>"Algo"
    },
    Mutation:{
        nuevoUsuario:async(_,{input})=>{
            const{email,password}=input;
            //revisar user registrado
            const existeUsuario=await Usuario.findOne({email});
            if(existeUsuario){
                throw new Error('El usuario ya esta registrado')
            }
            //hashpass
            const salt=await bcrypt.genSalt(10);
            input.password=await bcrypt.hash(password,salt);
            //save en db
            try {
                const usuario= new Usuario(input);
                usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }
        }
    }
}

module.exports=resolvers;