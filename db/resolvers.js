const Usuario = require("../models/Usuario");
const Product = require("../models/Product");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");

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
        },
        obtenerPedidos:async()=>{
            try {
                const pedidos= await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidosVendedor:async(_,{},ctx)=>{
            try {
                const pedidos=await Pedido.find({vendedor:ctx.usuario.id});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedido:async(_,{id},ctx)=>{
            //verify 
            const pedido=await Pedido.findById(id);
            if(!pedido){
                throw new Error('Pedido no encontrado');
            }
            //quien lo creo lo ve
            if(pedido.vendedor.toString()!==ctx.usuario.id){
                throw new Error('acción no permitida');
            }
            //return res
            return pedido;
        },
       obtenerPedidosEstado:async(_,{estado},ctx)=>{
        const pedidos=await Pedido.find({vendedor:ctx.usuario.id,estado});
        return pedidos;
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
            let cliente = await Cliente.findById(id);
            if(!cliente){
                throw new Error('Cliente no existente');
            }
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes acceso')
            }
            cliente=await Cliente.findOneAndUpdate({_id:id},input,{new:true});
            return cliente;
        },
        eliminarCliente:async(_,{id},ctx)=>{

            let cliente = await Cliente.findById(id);

            if(!cliente){
                throw new Error('Cliente no existente');
            }
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes acceso')
            }
            await Cliente.findOneAndDelete({_id:id});
            return 'Cliente Eliminado'
        },
        nuevoPedido:async(_,{input},ctx)=>{
            const {cliente}=input;
            //cliente or not
            let clienteExiste = await Cliente.findById(cliente);

            if(!clienteExiste){
                throw new Error('Cliente no existente');
            }
            //cliente es del vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tiene accesso');
            }
            for await(const articulo of input.pedido){
                const{id}=articulo;
                const producto =await Product.findById(id);
                // console.log(producto);
                if(articulo.cantidad>producto.existencia){
                    throw new Error(`Articulo ${producto.nombre} excede la cantidad disponible`);
                }else{
                    //resta cantidad a disp
                    producto.existencia=producto.existencia-articulo.cantidad;
                    await producto.save();
                }
            };
            //crear pedido
            const nuevoPedido=new Pedido(input);
            //asigna vendedor
            nuevoPedido.vendedor=ctx.usuario.id;
            //save Db
            const result=await nuevoPedido.save();
            return result;
        },
        actualizarPedido:async(_,{id,input},ctx)=>{
            const {cliente}=input;
            try {
                //pedido exists
                const existePedido=await Pedido.findById(id);
                if(!existePedido){
                    throw new Error('El pedido no existe');
                }
                //cliente exis
                const existeCliente=await Cliente.findById(cliente);
                if(!existeCliente){
                    throw new Error('Cliente no existente')
                }
                //cliente y pedido pertenece al vendedor
                if(existeCliente.vendedor.toString()!==ctx.usuario.id){
                    throw new Error('no tiene acceso');
                }
                //revisar stock
                if(input.pedido){
                    for await (const articulo of input.pedido) {
                        const{id}=articulo;
    
                        const producto=await Product.findById(id);
                        if(articulo.cantidad>producto.existencia){
                            throw new Error(`El articulo ${producto.nombre} excede el stock disponible`)
                        }else{
                            producto.existencia=producto.existencia-articulo.cantidad;
                            await producto.save();
                        }
                    }
                }
                //save
                const result=await Pedido.findOneAndUpdate({_id:id},input,{new:true});
                return result;
            } catch (error) {
                console.log(error);
            }
        },
        eliminarPedido:async(_,{id},ctx)=>{
            //verify
            const pedido=await Pedido.findById(id);
            if(!pedido){
                throw new Error('El pedido no existe');
            }
            //vendedor borra
            if(pedido.vendedor.toString()!==ctx.usuario.id){
                throw new Error('Acceso restringido');
            }
            await Pedido.findOneAndDelete({_id:id});
            return '¡Pedido Eliminado!';
        }
    }
}

module.exports=resolvers;