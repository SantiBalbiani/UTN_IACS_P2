function healthCheck(req, res, next) {
    if (req.originalUrl === '/health') {
        return res.json({ status: 'UP' });
    } else {
        next();
    }
}

function inestabilidadDeRed() {
    let numeroRequest = 0;
    return (req, res, next) => {
        numeroRequest += 1;
        if (numeroRequest % 2 === 0) {
            setTimeout(next, 5000);
        } else {
            next();
        }
    };
}

 function setMaxAttempts(req, res, next){
    var max = 5;
    req.maxAttempts = max;
    next();
 }

module.exports = {
    healthCheck,
    inestabilidadDeRed,
    setMaxAttempts
};
