
const mongoose = require("mongoose");

const config = require("config");

const mongoProtocol = config.get("DB_PROTOCOL") ; // Reside en Atlas
const mongoServer = config.get("DB_SERVER") ;
//const mongoDB = config.get("DB_BASE") ;
const mongoUser= config.get("DB_USER");
const mongoPassword  = config.get("DB_PASS");
const mongoDB = "logsCNC"

const mongoConectionString = `${mongoProtocol}://${mongoUser}:${mongoPassword}@${mongoServer}/${mongoDB}?retryWrites=true`;

//console.log (mongoConectionString)

mongoose.connect(mongoConectionString, {useNewUrlParser : true, useCreateIndex: true})
    .then(()=>{console.log("conectado a MongoDB Atlas (En la Nube). parametrizado");})
    .catch((err)=>{console.log("Algo fue mal con los parametros: \n" + err )});


    const taskSchema = new mongoose.Schema({
        programa: String,
        campo: String,
        BX: String,
        BY: String,
        BZ: String,
        start: String,
        stop: String,
        tEfectivo: String,
        tTotal: String,
        piezas: Number,
        tMedio: String
    });


    const logSchema = new mongoose.Schema({
        nombreArchivo:String,
        maquina:String,
        fecha: String,
        horas: Number,
        minutos: Number,
        segundos:Number,
        piezas:Number,
        trabajos:[{type: taskSchema}]
    })
    
    const logCNCmod = mongoose.model('logs',logSchema);

    

async function agregarDB(objDia){
    //console.log("Recibido por agregarDB" + objDia);
    
    logCNCmod.findOneAndReplace({'maquina': objDia.maquina, 'nombreArchivo':objDia.nombreArchivo}, objDia, function(err, data){
        if (err) return console.log ("Error al añadir el fichero: " + err)
        if (!data){
            //no se ha encontrado: lo añadimos
            var logCNC = new logCNCmod(objDia)
            logCNC.save()
            return console.log("añadido: " + objDia.nombreArchivo)
        }

        return console.log("reemplazado: " + data.nombreArchivo)
        
    })

}

module.exports.agregarDB = agregarDB