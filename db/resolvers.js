const Usuario = require("../models/Usuario");
const Product = require("../models/Product");
const Cliente = require("../models/Cliente");
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
require('dotenv').config({path:'variables.env'});

const crearToken=(usuario,secreta,expiresIn)=>{
    // console.log(usuario);
    const{id,email,nombre,apellido}=usuario
    return jwt.sign({id,email,nombre,apellido},secreta,{expiresIn})
}
//resolver
const resolvers={
    Query:{
        obtenerUsuario:async(_,{token})=>{
            const usuarioId=await jwt.verify(token,process.env.SECRET_KEYJWT)
            return usuarioId;
        },
        obtenerProductos:async()=>{
            try {
                const productos=await Product.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto:async(_,{id})=>{
            //existe
            const producto=await Product.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado')
            }
            return producto;
        },
        obtenerClientes:async()=>{
            try {
                const clientes=await Cliente.find({});
                if(!clientes){
                    console.log("No se encontraron clientes");
                }
                return clientes
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor:async(_,{},ctx)=>{
            try {
                const clientes=await Cliente.find({vendedor:ctx.usuario.id.toString()});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente:async(_,{id},ctx)=>{
            try {
                const cliente=await Cliente.findById(id);
                if(!cliente){
                    throw new Error('Cliente no encontrado')
                }

                if(cliente.vendedor.toString() !== ctx.usuario.id){
                    throw new Error('No tienes acceso')
                }
                return cliente;

            } catch (error) {
                console.log(error);
            }
        }
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
        },
        autenticarUsuario:async(_,{input})=>{
            const {email,password}=input
            //user existentee
            const existeUsuario=await Usuario.findOne({email});
            if(!existeUsuario){
                throw new Error('El usuario no existe');
            }
            //pass correct?:
            const passwordCorrecto=await bcrypt.compare(password,existeUsuario.password);
            if(!passwordCorrecto){
                throw new Error('El password es incorrecto');
            }
            //create token
            return{
                token:crearToken(existeUsuario,process.env.SECRET_KEYJWT,"24h")
            }
        },
        nuevoProducto:async(_,{input})=>{
            try {
                const producto = new Product(input);

                const resultado=await producto.save();

                return resultado
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto:async(_,{id,input})=>{
            let producto=await Product.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado');
            }
            //save
            producto=await Product.findOneAndUpdate({_id:id},input,{new:true});
            return producto
        },
        eliminarProducto:async(_,{id})=>{
            let producto=await Product.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado');
            }
            await Product.findOneAndDelete({_id:id});
            return "Producto eliminado";
        },
        nuevoCliente:async(_,{input},ctx)=>{
            const{email}=input
            //cliente registrad
            console.log(ctx);
            console.log(input);
            const cliente=await Cliente.findOne({email});
            if(cliente){
                throw new Error('Cliente ya registrado');
            }
            //asignad vendedor
            const nuevoCliente=new Cliente(input);
            nuevoCliente.vendedor=ctx.usuario.id;

            try {
                const res=await nuevoCliente.save();
                return res;
                
            } catch (error) {
                console.log(error);
            }
        },
        actualizarCliente:async(_,{id,input},ctx)=>{

            //existe

            //vend
        }
    }
}

module.exports=resolvers;