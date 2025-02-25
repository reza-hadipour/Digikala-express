const {validationResult} = require('express-validator');

const createHttpErrors = require('http-errors');

module.exports.validation = async (req,res,next)=>{
    if(!validationData(req)){
        // throw createHttpErrors[400](req.errors.join(','));
        return sendErrorResponse(res,createHttpErrors.BadRequest(req.errors));
    }else{
        next();
    }
}

function sendErrorResponse(res,error){
    let err = {
        status: 'failed',
        statusCode: error.statusCode,
        errors: error.message
    }

    return res.status(error.statusCode).json(err)
}


function validationData(req){
        const errorResults = validationResult(req);
        if(!errorResults.isEmpty()){
            let errors = [];
            for (const err of errorResults.array()) {
                errors.push({param: err.path, message: err.msg})
            }
            req.errors = errors;
            return false;
        }
        return true
}