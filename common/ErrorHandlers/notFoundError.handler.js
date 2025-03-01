module.exports.notFoundErrorHandler = (req,res,next)=>{
    return res.status(404).json({
        statusCode: 404,
        message: `${req.method} ${req.url} Not Found`
    })
}