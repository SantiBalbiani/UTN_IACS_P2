//Unuseful since it only makes a promise of the result of a function, not its process.
function toPromise(error, data) {
    return new Promise((resolve, reject) => {
        if (error) {
            reject(error);
        } else {
            resolve(data);
        }
    })
}

module.exports = {
    toPromise
};