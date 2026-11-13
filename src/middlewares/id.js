const mongoose = require ("mongoose");
const AppErorr =require ("../utils/appError");

const id = (req,res,next)=>{
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
        return next(new AppErorr('Invalid ID',400));
    }
    next();
};
module.exports=id;