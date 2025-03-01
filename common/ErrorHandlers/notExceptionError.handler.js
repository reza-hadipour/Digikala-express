module.exports.allExceptionErrorHandler = (err,req,res,next) => {
    
    let status = err?.status ?? err?.statusCode ?? err?.code;
    let response = {};

    if(!status || isNaN(+status) || status > 511 || status < 200) status = 500;

    if(process.env.NODE_ENV === "development"){
        response = {
            message: err?.message ?? "Internal Server Error",
            stack : err?.stack ?? ''
        }
    }else{
        response = {
            message: err?.message ?? "Internal Server Error",
        }
    }

    return res.status(status).json(response)

}