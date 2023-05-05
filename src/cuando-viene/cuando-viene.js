const express = require('express');
const { colectivoMasCercano } = require('../ubicacion');
const { get } = require('../request');
const { healthCheck } = require('../middleware.js');
const { SERVICIOS } = require('../config');
const { toPromise } = require('./promisify');
const TRANSITO = SERVICIOS.cuandoViene;

const app = new express();

function getToPromise(service, endpoint) {
    return new Promise((resolve, reject) => {
        get(service, endpoint, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

function getLineasDeUnaParada(lineas) {

    let lineasPromise = lineas.map(
        linea =>
            getToPromise(SERVICIOS.lineas, `/lineas/${linea}`)
    )
    console.log(lineasPromise);
    return Promise.all(lineasPromise);
}

app.use(healthCheck);

app.get('/cuando-viene/:parada', (req, res) => {
    const parada = req.params.parada;
    // Queremos obtener, para cada linea de la parada, el próximo colectivo que va a llegar
    // Sin promise
    //  get(SERVICIOS.paradas, `/paradas/${parada}`, (errorParada, dataParada) => toPromise(errorParada, dataParada)
    getToPromise(SERVICIOS.paradas, `/paradas/${parada}`)
        .then(datosParada => {
            getLineasDeUnaParada(datosParada.lineas)
                .then(lineas => {
                  let colectivosProximos =    lineas.colectivos
                        .filter(colectivo => (colectivo.ubicacion - datosParada.ubicacion) >= 0)
                        //.sort( (a,b) => a < b )[0];       
                  res.json(colectivosProximos);                 
                })
        })
})
//Hacer la diferencia ubic colectivo - ubic parada. Eso hacerle math.min y te da el tiempo de llegada
//Eso hay que hacerlo para todos los colectivos para saber cual es el colectivo mas cercano de esa linea.
//La rta tiene que ser un único colectivo.

app.listen(TRANSITO.puerto, () => {
    console.log(`[${TRANSITO.nombre}] escuchando en el puerto ${TRANSITO.puerto}`);
});

