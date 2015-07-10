  // objects
  var express = require("express");
  var app = express();
  var http = require('http').Server(app);
  var io = require('socket.io')(http);
  var database = require('./dbSqlite.js');
  var bodyParser = require('body-parser');
  var path = require('path');
  var MyIP = require('my-local-ip')();

  // custom vars
  var clientes = 0;
  var clientsData = [];
  var clientsSockets = [];
  var datosCheck = [];


  // carpeta de archivos estaticos
  app.use("/assets", express.static(__dirname + '/assets'));

  // habliitar Json
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // las conexiones a la raiz son clientes, van a pantalla.html
  app.get('/', function(req, res){
      res.sendFile(__dirname + '/pantalla.html');
  });

  // las conexiones a la ruta /admin son de administracion, usan admin.html
  app.get('/admin',function(req, res){
    res.sendFile(__dirname + '/admin.html')
  });

  /// comprueba si existe la prenda
  app.post('/buscaPrenda',function(req,res){
    // recogemos los datos que vienen por ajax
    var datos = {};
    datos.ip = req.body.ip;
    datos.referencia = req.body.referencia;
    datos.id = req.body.idSocket;

    var resp = new Object();
    database.buscaPrenda(datos.referencia ,function(err,data){
      if(data.length>0){
        /// si hay prenda asi que preguntamos si la quiere asignar
        resp.cantidad = 1;
        resp.datos = data[0];

        res.send(JSON.stringify(resp)); 
        //console.log(data[0]);
      }else{
        
        resp.cantidad = "NO";
        res.send(JSON.stringify(resp)); 
      }

    });


  });

  app.post('/asignaPrenda', function(req,res){

      var _data = {};
      _data.ip = req.body.ip;
      _data.referencia = req.body.ref;

      var resp = new Object();
      database.asignaPrendaPantalla(_data,function(err,data){
        if(err){
          resp.cantidad = "ERROR";
          res.send(JSON.stringify(resp)); 
        }else{
          resp.cantidad =data;
          resp.ip = _data.ip;
          res.send(JSON.stringify(resp));
          

          var i = arrayObjevtIndexOf(clientsSockets, req.body.id, 'id');
          var socketid = clientsSockets[i];

          // mandamos el mensaje
          socketid.emit('muestraPrenda',data);

          compruebaClientes();
        }
      });
  })



  io.set('authorization', function (handshakeData, callback) {
      var ipAcomprobar = handshakeData.socket._peername.address;

      // si hay mas de una compruebas
      if(io.sockets.sockets.length>0){
        io.sockets.sockets.map(function(e){

          if(ipAcomprobar === e.handshake.address){
            // ya hay una ip en la lista
            // mintiroooooooso a la puta calle
            callback(null, false);
          }else{
            // no hay ip asi que padentro
            callback(null, true);
          }
          //console.log(e.handshake.address);
        })
      }else{

        // sino hay mas de una pues autorizas siemper porque es el primero
         callback(null, true); // error first, 'authorized' boolean second 
      }
     
  });


  io.on('connection', function(socket){
    // sumamos uno a nuestro counter
    clientes++;
    // creamos un objeto data cliente y lo metermos en el array
    var clData = new Object();
    clData.id = socket.id;
    clData.ip = socket.request.connection._peername.address;
    clientsData.push(clData);


    //pedimos los datos de la ip
    database.buscaPorIp(socket.request.connection._peername.address,function(err,data){

        if(data.length>0){
          // hay registro
          clientsData[clientsData.indexOf(clData)].idBd = data[0].id;
          clientsData[clientsData.indexOf(clData)].nombre = data[0].nombre;
          clientsData[clientsData.indexOf(clData)].rol = data[0].rol;
        }else{
          // no hay registro
          clientsData[clientsData.indexOf(clData)].idBd = 0;
          clientsData[clientsData.indexOf(clData)].nombre = 'nuevo';
          clientsData[clientsData.indexOf(clData)].rol = 'pendiente';
        }
    });




    clientsSockets.push(socket);








    socket.on('disconnect', function(socket){ 
      // restamos uno a nuestro counter
      clientes--;
      // borramos ese cliente del array
      delete clientsSockets[socket.id];

      var cual = arrayObjevtIndexOf(clientsData, socket.id, 'id');
      clientsData.splice(cual, 1);

    });

    socket.on('quienSoy',function(){
      //busca los datos en la bd por tu ip
      var ip = socket.request.connection._peername.address;
      console.log(ip);
      
      database.quePrendaTengo(ip,function(err,data){


        if(data.length>0){
          // console.log(data);
          // enviale sus datos de la prenda al que te ha preguntao

          var i = arrayObjevtIndexOf(clientsSockets, socket.id, 'id');
          var socketid = clientsSockets[i];
         

          // mandamos el mensaje
          socketid.emit('muestraPrenda',data);
        }

      });
    })

    socket.on('parpadea',function(msg){
      var i = arrayObjevtIndexOf(clientsSockets, msg.destinoId, 'id');

      var socketid = clientsSockets[i];
      socketid.emit('parpadea', msg);
    });


    /******* desconexion de user *******/
  	socket.on('chat message', function(msg){
    	//console.log('message: ' + msg);
    	io.emit('chat message', msg + "   " + socket.request.connection._peername.address);
  	});

    /******* cambia los datos del equipo *******/
    socket.on('cambiaDatosEquipo', function(msg){
      database.udpateData(msg,function(data,err){
        
      });
    });

    socket.on('reload',function(msg){
      var i = arrayObjevtIndexOf(clientsSockets, msg.destinoId, 'id');
      var socketid = clientsSockets[i];
      socketid.emit('reload');
    });


    socket.on('nuevoCodigoBarras',function(msg){
      console.log(msg);
    });


    compruebaClientes();
  });

// inicia el server we
http.listen(3000,MyIP, function(){
  console.log('listening on ' + MyIP + '*:3000');
});



/*
envia cada 5 segs un mensaje con los datos del cliente
*/
function compruebaClientes(){
  datosCheck = [];
  console.log("***************");
  io.sockets.sockets.map(function(e){
    var i = arrayObjevtIndexOf(clientsSockets, e.id, 'id');

    var data = new Object();
    data.id = e.id;
    data.ip = clientsSockets[i].request.connection._peername.address;
    data.nombre = "no";
    data.rol = "no";
    datosCheck.push(data);

    console.log("interna " + e.id + " " + clientsSockets[i].request.connection._peername.address + " " + e.connected);
  })
  //mandamos el array para pillar los nombres,rol de la bd
  buscaDatosFaltan(datosCheck);
}

// pedimos en la bd los datos que nos faltan de los users
function buscaDatosFaltan(_datosCheck){
  database.dameNombres(_datosCheck, function(d){
    io.emit('usersData', d);
  });
}

// busca el index en un array de objs
function arrayObjevtIndexOf(myArray, searchTerm, property){
  for(var i = 0, len = myArray.length; i < len; i++){
    if(myArray[i][property]=== searchTerm) return i;
  }
  return -1;
}


setInterval(compruebaClientes,10000);