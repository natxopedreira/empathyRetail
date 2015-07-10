var socket = io.connect();

/// recibimos el array de clientes y lo mostramos en un li
socket.on('usersData',function(msg){
//console.log(msg);
  for (var i = msg.length - 1; i >= 0; i--) {
    var agregar = 1;

    var tr = '<tr>'
        tr += '<td class="nombre">'+msg[i].nombre+'</td>';
        tr += '<td class="rol">'+msg[i].rol+'</td>';
        tr += '<td class="id">'+msg[i].id+'</td>';
        tr += '<td class="ip">'+msg[i].ip+'</td>';
        tr += '<td align="center"><a href="#" class="'+msg[i].id+'" ';
        tr += 'style="display:block; background-color:#FFCC00;text-align:center; padding-bottom:5px; color:#000; text-decoration:none">parpadea</a></td>';
        tr += '<td align="center" class="campo"><input type="text" value="'+msg[i].referencia+'" class="prenda" readOnly="true"></td>';
        tr += '<td align="center"><a href="#popupPrenda" data-rel="popup" data-position-to="window" data-transition="pop" class="prenda'+msg[i].id+'" style="display:block; background-color:#00a2ff;text-align:center; padding-bottom:5px; color:#000; text-decoration:none">asignar prenda</a></td>';
        tr += '</tr>';


        $('#equipos tr').each((function() {
          //console.log($(this).find("td.nombre").text());
          var ip = $(this).find("td.ip").text();
          var id = $(this).find("td.id").text();
          var nombre = $(this).find("td.nombre").text();
          var rol = $(this).find("td.rol").text();
          var referencia = $(this).find("td.campo input").val();
                
          if(ip == msg[i].ip){
            agregar = 0;
                  
            // comprueba si tiene el mismo id de socket
            if (msg[i].id !== id ) {$(this).find("td.id").text(msg[i].id)};
            if (msg[i].nombre !== nombre ) {$(this).find("td.nombre").text(msg[i].nombre)};
            if (msg[i].rol !== rol ) {$(this).find("td.rol").text(msg[i].rol)};
            if (msg[i].referencia !== referencia ) {$(this).find("td.campo input").val(msg[i].referencia)};

          }

        }));
              
        if(agregar == 1){

        $('#equipos ').append(tr);
        $("table#equipos tr:even").css("background-color", "#CCCCCC");

        /// identificar a la pantalla
        $('.' + msg[i].id).click(function(msg){
                      
          var msgObj = new Object();
          msgObj.ip = $(this).parent().parent().find("td.ip").text();
          msgObj.destinoId = $(this).parent().parent().find("td.id").text();
          msgObj.nombre = $(this).parent().parent().find("td.nombre").text();
          
          socket.emit('parpadea', msgObj);

          return false;
        });



        /// mirar en la bd si existe la prenda con la referencia N
        $('.buscaPrenda').click(function(){
          /// mandas la consulta para ver si existe la prenda
          var data = {};
          data.ip = $('div#popupPrenda input#ip').val();
          data.referencia = $('div#popupPrenda input#referencia').val();
          data.idSocket =  $('div#popupPrenda input#id').val();

          $.ajax({
            url: "/buscaPrenda",
            type: "POST",
            data: JSON.stringify(data),
            contentType: 'application/json',
            cache: false,
            timeout: 5000,
            complete: function() {
              //called when complete
              //console.log('process complete');
            },
            success: function(data) {
              var json = $.parseJSON(data);

              if(json.cantidad == "NO"){

                $('div#popupPrenda input#referencia').val('');
                $('div#popupPrenda input#referencia').prop("placeholder",'NO HAY PRENDA CON ESA REFERENCIA');

              }else{

                $('div#buscarPrenda').hide();
                $('div#asignar').show();

                $('div#asignar h1').html(json.datos.nombre);
                $('div#asignar span#miniatura').html('<img src="'+json.datos.img0+'" width="500px" height="225px" />');
                $('div#asignar input#refPrenda').val($('div#popupPrenda input#referencia').val());

              }},

            error: function() {
              console.log('process error');

            }})
          });

          // abrimos el menu para buscar una prenda
          $('.prenda' + msg[i].id).click(function() {
            /// pasamos la ip y el id que queremos asignar al popuuuuu
            $('div#popupPrenda input#referencia').val('');
            $('div#popupPrenda input#ip').val($(this).parent().parent().find('td.ip').text());
            $('div#popupPrenda input#id').val($(this).parent().parent().find('td.id').text());

            // le decimos que es solo lectura
            $('div#popupPrenda input#ip').prop("readonly",true);
            $('div#popupPrenda input#id').prop("readonly",true);

            $('div#buscarPrenda').show();
            $('div#asignar').hide();

          })

                  // pasamos el foco al campo de texto para poner la referencia
          $( "#popupPrenda" ).popup({
            afteropen: function( event, ui ) {
              $('div#popupPrenda input#referencia').focus();
            }
          });

          // asigna la referencia a la pantalla
          $('#asignaPrenda').click(function(){
            var _data = {};
            _data.ip = $('div#asignar input#ip').val();
            _data.id = $('div#asignar input#id').val();
            _data.ref = $('div#asignar input#refPrenda').val();


            $.ajax({
              url: "/asignaPrenda",
              type: "POST",
              data: JSON.stringify(_data),
              contentType: 'application/json',
              cache: false,
              timeout: 5000,
              complete: function() {
              },

              success: function(data) {
                var json = $.parseJSON(data);
                $( "#popupPrenda" ).popup( "close" );

                var msgObj = new Object();
                msgObj.ip = _data.ip;
                msgObj.destinoId = _data.id;

                socket.emit('reload', msgObj);

              },
              
              error: function() {
                console.log('process error');
              }
            })

          })


        }

      };
});