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

function getLineasDataDeUnaParada(parada) {

    let lineasDeUnaParada = parada.lineas.map(
        idLinea =>
            getToPromise(SERVICIOS.lineas, `/lineas/${idLinea}`)
    )
    return Promise.all(lineasDeUnaParada)
};


function getColectivosActivos(lineasDeParada) {
    return new Promise((resolve, reject) => {
        if (!lineasDeParada) {
            reject('No existen Lineas')
        }

        resolve(
            lineasDeParada.filter(linea => linea.funciona)
                .map(l => l.colectivos)
                .flat())
    }
    );
};

function getClosestBus(colectivos, ubicacionParada) {
    let closestBuses = colectivos
        .filter(colectivo => (ubicacionParada - colectivo.ubicacion) >= 0)
        .sort((a, b) => a < b);
    closestBus = closestBuses[0];
    return new Promise((resolve, reject) => {
        if (!colectivos) {
            reject('There are no Active Colectivos')
        }
        if (!closestBus) {
            reject('There are no buses close yet')
        }
        resolve(closestBus)
    })
}


app.use(healthCheck);

app.get('/cuando-viene/:parada', (req, res) => {
    const parada = req.params.parada;
    var ubicacionParada = 0;
    // Queremos obtener para cada linea de la parada, el próximo colectivo que va a llegar
    getToPromise(SERVICIOS.paradas, `/paradas/${parada}`)
        .then(datosParada => {
            ubicacionParada = datosParada.ubicacion;
            return getLineasDataDeUnaParada(datosParada);
        })
        .then(lineasParada => getColectivosActivos(lineasParada))
        .then(colectivos => getClosestBus(colectivos, ubicacionParada))
        .then(colectivoMasCercano => res.json(colectivoMasCercano))
        .catch(err => res.send(`Error debido a ${err}`));
})
//Hacer la diferencia ubic colectivo - ubic parada. Eso hacerle math.min y te da el tiempo de llegada
//Eso hay que hacerlo para todos los colectivos para saber cual es el colectivo mas cercano de esa linea.
//La rta tiene que ser un único colectivo.

app.listen(TRANSITO.puerto, () => {
    console.log(`[${TRANSITO.nombre}] escuchando en el puerto ${TRANSITO.puerto}`);
});

