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