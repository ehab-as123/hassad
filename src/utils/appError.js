const { models } = require("mongoose");

class AppError extends Error{
    constructor(message , statusCode = 500){
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = AppError ;