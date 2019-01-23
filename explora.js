const fs = require('fs')
const readLine = require('readline')
const db = require('./db.js')

function leerCarpetas(arrCarpetas, maquina, fechaLimite){

    return new Promise(function(resolve, reject){

        var objResumen = {'carpetas': arrCarpetas,
        'horasTotales':0,
        'minutosTotales':0,
        'segundosTotales':0,
        'piezasTotales':0,
        'carpetas':[]                
        }

        arrCarpetas.forEach(async function(element,index){
        var carpeta = await leerCarpeta(element, maquina, fechaLimite)

        if(carpeta){

            objResumen.horasTotales += carpeta.horasTotales
            objResumen.minutosTotales += carpeta.minutosTotales
            objResumen.segundosTotales += carpeta.segundosTotales
            objResumen.piezasTotales +=  carpeta.piezasTotales
            objResumen.carpetas.push(carpeta)
    
            if (index == arrCarpetas.length -1 ) {
    
                //normalizamos los contadores de objAnno
                //agregamos los segundos a los minutos
    
                objResumen.minutosTotales += Math.floor(objResumen.segundosTotales / 60)
                objResumen.segundosTotales = objResumen.segundosTotales % 60
    
                //agregamos los minutos a las horas 
                objResumen.horasTotales += Math.floor(objResumen.minutosTotales / 60)
                objResumen.minutosTotales = objResumen.minutosTotales % 60
    
    
                resolve(objResumen   )
    
            }

        }


        })

    })


    
}

function leerCarpeta(carpeta,maquina, fechaLimite){
    return new Promise(function(resolve, reject){

        var datFechaLimite= new Date(fechaLimite) // string a Date
        
        if(! fs.existsSync(`${__dirname}\\logs\\${maquina}\\${carpeta}`)) return null

        var listaArchivos=fs.readdirSync(`${__dirname}\\logs\\${maquina}\\${carpeta}` )

        var objAnno = {'carpeta': carpeta,
                        'horasTotales':0,
                        'minutosTotales':0,
                        'segundosTotales':0,
                        'piezasTotales':0,
                        'dias':[]                
                        }
      
    
        listaArchivos.forEach(async function(element, index) {
            if (element.substring(element.lastIndexOf('.'))=='.pro'){
                    
                    resultado = await leeArchivo(maquina,carpeta,element)
                       
                    //tenemos en resultado un objeto con el resumen del dia y 
                    //un array de programas
    
                    var p_resultado=procesarArchivo(resultado)
                    
                    objAnno.horasTotales += p_resultado.horas
                    objAnno.minutosTotales += p_resultado.minutos
                    objAnno.segundosTotales += p_resultado.segundos
                    objAnno.piezasTotales +=  p_resultado.piezas

                    //añadimos uns nueva propiedad al resultado antes de adjuntarlo a la carpeta
                    p_resultado.nombreArchivo = element
                    p_resultado.maquina = maquina


                    var datFechaArchivo = new Date(p_resultado.fecha)
                    
                    objAnno.dias.push(p_resultado)
    
                   //TODO: lo insertamos en la base de datos si no existe
                   if (datFechaArchivo >= datFechaLimite ) {
                    
                    db.agregarDB(p_resultado)
                   } 

                    //******************************** */
                   
            }
    
            if (element.substring(element.lastIndexOf('.'))=='.dia'){
                //console.log('Procesar .dia')
            }
            

            if (index == (listaArchivos.length -1)) {
                //normalizamos los contadores de objAnno
                //agregamos los segundos a los minutos
                
                objAnno.minutosTotales += Math.floor(objAnno.segundosTotales / 60)
                objAnno.segundosTotales = objAnno.segundosTotales % 60

                //agregamos los minutos a las horas 
                objAnno.horasTotales += Math.floor(objAnno.minutosTotales / 60)
                objAnno.minutosTotales = objAnno.minutosTotales % 60
                
              
                resolve(objAnno)
                //
              
            }

            }) // end forEach


    })
    
    
}




function leeArchivo(maquina,carpeta,nombreArchivo){
    return new Promise(function(resolve , reject){
        var fileLineArray = [nombreArchivo]
        var file = `${__dirname}\\logs\\${maquina}\\${carpeta}\\${nombreArchivo}` 
        var lineReader = readLine.createInterface({
                input: fs.createReadStream(file)
            })
            lineReader.on('line', function (line) {
                        //console.log(line) 
                        fileLineArray.push(line)
            })
            lineReader.on('close', function(){
                resolve(fileLineArray)
            })
    })
}



function procesarArchivo(archivo){
    

        var fecha = new Date(`${archivo[0].substring(0,4)}-${archivo[0].substring(4,6)}-${archivo[0].substring(6,8)}` )
        var tiempo = archivo[1].split(',')
        var horas = parseFloat(tiempo[0])
        var minutos= parseFloat(tiempo[1])
        var segundos = parseFloat(tiempo[2])
        var piezas = parseFloat(tiempo[3])
    
        var extraccionArchivo = {'fecha': fecha.toLocaleDateString(),
                                'horas': horas,
                                'minutos': minutos,
                                'segundos':segundos,
                                'piezas':piezas,
                                'trabajos':[]
                                }
        
        for(var i=2; i<archivo.length;  i++){


            var p_resultado=  procesarTrabajo(archivo[i], fecha)

            extraccionArchivo.trabajos.push(p_resultado)
           
        }
    
        return extraccionArchivo


    

    

}


function procesarTrabajo(trabajo, fecha){
    
    

        var arrTrabajo = trabajo.split(',')
    
        var horaInicio = new Date(fecha.getFullYear(),fecha.getMonth(),fecha.getDate(), arrTrabajo[6], arrTrabajo[7], arrTrabajo[8])
        var horaFin = new Date(fecha.getFullYear(),fecha.getMonth(),fecha.getDate(), arrTrabajo[9], arrTrabajo[10], arrTrabajo[11])
        var tEfectivo=new Date(0,0,0,  arrTrabajo[12], arrTrabajo[13], arrTrabajo[14] )
        var tTotal=new Date(0,0,0,  arrTrabajo[15], arrTrabajo[16], arrTrabajo[17] )
        var tMedio=new Date(0,0,0,  arrTrabajo[19], arrTrabajo[20], arrTrabajo[21], arrTrabajo[22] )

        return {'programa': arrTrabajo[1],
                'campo': arrTrabajo[0],
                'BX':arrTrabajo[3],
                'BY':arrTrabajo[4],
                'BZ':arrTrabajo[5],
                'start': horaInicio.toLocaleString(),
                'stop':horaFin.toLocaleString(),
                'tEfectivo': tEfectivo.toLocaleTimeString(),
                'tTotal': tTotal.toLocaleTimeString(),
                'piezas':arrTrabajo[18],
                'tMedio':tMedio.toLocaleTimeString()
            }
    

  
}


//Tests


// leeArchivo('2016','20160930.pro')
//     .then(function(result){
//         console.log(procesarArchivo(result))
//     }   
// )



// (async function(){
//     var resultado = await leerCarpeta('2017')
//     console.log(resultado)
// })()



(async function(){

    var resultado = await leerCarpetas(['2011','2012','2013','2014','2015','2016','2017','2018','2019'],'cnc2','2019-01-01')
   
    console.log(resultado)
    
  
})()
