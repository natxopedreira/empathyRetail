var sqlite3 = require('sqlite3').verbose(),
db = new sqlite3.Database('assets/demoApp.sqlite'),
dbSqlite = {};

dbSqlite.buscaPorIp= function(_ip, callback){
	db.all("SELECT * from equipos WHERE ip='"+_ip+"'",function(err, rows){
		if(err)
		{
			throw err;
		}
		else
		{
			callback(null, rows);
		}
	});
}

dbSqlite.quePrendaTengo = function(_ip, callback){
	db.all("SELECT * from equipos WHERE ip='"+_ip+"'",function(err, rows){
		if(err)
		{
			throw err;
		}
		else
		{
			if(rows.length>0){
				db.all("SELECT * from prendas WHERE ref='"+rows[0].refAsignada+"'",function(err, rows){
					if(err)
					{
						throw err;
					}
					else
					{
						callback(null, rows);
					}
				});
			}else{
				//throw err;
			}

			//callback(null, rows);
		}
	});

}

dbSqlite.buscaPrenda= function(_ref, callback){
	db.all("SELECT * from prendas WHERE ref='"+_ref+"'",function(err, rows){
		if(err)
		{
			throw err;
		}
		else
		{
			callback(null, rows);
		}
	});
}

dbSqlite.asignaPrendaPantalla = function(_data, callback){
	db.run("UPDATE equipos SET refAsignada="+_data.referencia+" WHERE ip = '"+_data.ip+"'",function(err, rows){
		if(err)
		{
			throw err;
		}
		else
		{
			db.all("SELECT * from prendas WHERE ref='"+_data.referencia+"'",function(err, rows){
				if(err)
				{
					throw err;
				}
				else
				{
					callback(null, rows);
				}
			});
			//callback(null, _data.referencia);
			//callback(null, rows);
		}
	});
}

dbSqlite.dameNombres = function(_data, callback){

	var arrayIp=[];
	for(var l = 0; l < _data.length; l++){
		arrayIp[l]= "'" +_data[l].ip + "'";
	}
	//console.log(arrayIp);

	db.all("SELECT * from equipos WHERE ip IN ("+arrayIp+")",function(err, rows){
			if(err){
				
			}else{
				for(var r=0; r < rows.length; r++){
					var i = arrayObjevtIndexOf(_data, rows[r].ip, 'ip'); 
					_data[i].referencia = rows[r].refAsignada;
					_data[i].nombre = rows[r].nombre;
					_data[i].rol = rows[r].rol;
				}

				callback(_data);
			}
		});
}


dbSqlite.udpateData = function(_data,callback){
	//console.log("UPDATE equipos SET nombre = '" + _data.nombre+ "', ip ='"+_data.ip+"', rol ='"+_data.rol+"'  WHERE id = "+_data.idBd+"");
	db.run("UPDATE equipos SET nombre = '" + _data.nombre+ "', ip ='"+_data.ip+"', rol ='"+_data.rol+"'  WHERE id = "+_data.idBd+"",function(err, rows){
		if(err)
		{
			throw err;
		}
		else
		{
			callback(null, rows);
		}
	});
}

function arrayObjevtIndexOf(myArray, searchTerm, property){
  for(var i = 0, len = myArray.length; i < len; i++){
    if(myArray[i][property]=== searchTerm) return i;
  }
  return -1;
}


module.exports = dbSqlite;
