const express = require('express');
const fs = require('fs');
const { SERVICIOS } = require('../config');
const { healthCheck } = require('../middleware.js');
const { actualizarUbicaciones } = require('./actualizarUbicaciones');

const LINEAS = SERVICIOS.lineas;

const lineasDb = {
    buscarPorLinea(linea, err, callback) {
        let result = JSON.parse(fs.readFileSync('./lineas.db.json', { encoding: 'utf8' }));
        //TODO: Agregar control estado de la linea cuando está activo y cuando no
        if (!result || (result && !result[linea])) {
            err("che no encontré nadaa");
        }

        callback(result[linea]);
        // callback(fs.readFileSync('./lineas.db.json').linea); //completar
        //callback({test:"holaTest"}); //mockTest
    }

};

const app = new express();

app.use(healthCheck);

app.get('/lineas/:linea', (req, res) => {
    const linea = req.params.linea;
    lineasDb.buscarPorLinea(linea,
        error => res.status(404).send(error),
        estadoLinea => res.json(estadoLinea)
    );
});

app.listen(LINEAS.puerto, () => {
    console.log(`[${LINEAS.nombre}] escuchando en el puerto ${LINEAS.puerto}`);
    actualizarUbicaciones();
});
