const AppError = require("../utils/appError");

const role = (...roles)=>(req,res,next)=>{
    if(! roles.includes(req.user.role)){
        return next(new AppError('Accsess denied',403))
    }
    next();
};
module.exports = role;