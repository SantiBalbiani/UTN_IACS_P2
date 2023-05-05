const express = require('express');
const { colectivoMasCercano } = require('../ubicacion');
const { get } = require('../request');
const { healthCheck } = require('../middleware.js');
const { SERVICIOS } = require('../config');
const {setMaxAttempts} = require('../middleware.js');
const TRANSITO = SERVICIOS.cuandoViene;

const app = new express();

function processGet(req, res) {
    const parada = req.params.parada;
    var ubicacionParada = 0;
    console.log(req.maxAttempts);
    req.maxAttempts--;
    getToPromise(SERVICIOS.paradas, `/paradas/${parada}`)
        .then(datosParada => {
            ubicacionParada = datosParada.ubicacion;
            return getLineasDataDeUnaParada(datosParada);
        })
        .then(lineasParada => getColectivosActivos(lineasParada))
        .then(colectivos => getClosestBus(colectivos, ubicacionParada))
        .then(colectivoMasCercano => {res.json(colectivoMasCercano)})
        .catch(err => {
            if(req.maxAttempts <= 0){
            res.send(`Error due to: ${err}`)}
            setTimeout(processGet(req, res), 1000)
        });
}


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

app.use(setMaxAttempts);

app.use(healthCheck);

app.get('/cuando-viene/:parada',processGet)

app.listen(TRANSITO.puerto, () => {
    console.log(`[${TRANSITO.nombre}] escuchando en el puerto ${TRANSITO.puerto}`);
});

