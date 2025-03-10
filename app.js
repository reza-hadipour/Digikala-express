const {join} = require('path');
const logger = require('morgan');
const express = require('express');
const sequelize = require('./configs/sequelize.config');
const autoBind = require('auto-bind').default;
const rfs = require('rotating-file-stream');

const router = require('./routes');
const passport = require('passport');

const { notFoundErrorHandler } = require('./common/ErrorHandlers/notFoundError.handler');
const { allExceptionErrorHandler } = require('./common/ErrorHandlers/notExceptionError.handler');


class Application{

    app;
    PORT;
    server;
    debugHttp;
    debugDb;
    debugRedis;

    constructor(){
        console.log('DEBUG is:', process.env.DEBUG);
        console.log('NODE_ENV:', process.env.NODE_ENV);
        autoBind(this);
        this.setDebugger();
        this.setupExpress()
        this.setupPassport();
        this.setupRedis();
        this.setLogger()
        this.setupDatabase()
        this.setupRoutes()
        this.setErrorHandlers();
    }

    setupExpress(){
        this.app = express();
        this.PORT = process.env.APP_PORT || 3000;
        this.app.use(express.urlencoded({extended:true}));
        this.app.use(express.json());
        this.app.use(express.static(join(__dirname,'public')))

        this.app.listen(this.PORT,()=> this.onListening())
        process.on("uncaughtException",this.onError)
    }

    async setupRedis(){
        try {
            require('./configs/redis.config');
            this.debugRedis('Connecting to Redis...')
            // redisClient.initialization();
        } catch (error) {
            this.debugRedis('Failed to setup Redis:', error)
        }

    }

    setupDatabase(){
        sequelize.authenticate()
        .then(()=> debugDb('Connected to MySQL successfully'))
        .catch(err=>{
            debugDb('Connecting to database failed -> ',err.original.sqlMessage)
            if(err) process.exit(1);
        })

        require('./modules/product/product.model');
        require('./modules/user/user.model');
        require('./modules/basket/basket.model');
        require('./modules/order/order.model');
        require('./modules/payment/payment.model');
        require('./common/associations');

        sequelize.sync()
    }

    setupPassport(){
        require('./configs/passport.config');
        passport.initialize();
    }

    setDebugger(){
        this.debugHttp = require('debug')('App');
        this.debugDb = require('debug')('Database');
        this.debugRedis = require('debug')('Redis');

        global.debugHttp = this.debugHttp;
        global.debugDb = this.debugDb;
        global.debugRedis = this.debugRedis;
    }

    setLogger(){
        const accessLogStream = rfs.createStream('access.log',{
            compress:'gzip',
            interval: '1d',
            path: join(__dirname,'log')
        })

        this.app.use(logger('combined',{
            stream: accessLogStream,
            immediate: true
        }));
        this.app.use(logger('dev'))
    }

    setupRoutes(){
        this.app.use(router)
    }

    onListening() {
        const addr = this?.host;
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + this.PORT;
        this.debugHttp(`${process.env.APP_NAME} is running on ` + bind);
    }

    setErrorHandlers() {
        this.app.use(notFoundErrorHandler)
        this.app.use(allExceptionErrorHandler)
    }

    onError(error) {
        if (error.syscall !== 'listen') {
          throw error;
        }
      
        const bind = typeof this.PORT === 'string'
          ? 'Pipe ' + this.PORT
          : 'Port ' + this.PORT;
      
        switch (error.code) {
          case 'EACCES':
            this.debugHttp(bind + ' requires elevated privileges');
            this.debugHttp(error);
            process.exit(1);
            break;
          case 'EADDRINUSE':
            this.debugHttp(bind + ' is already in use');
            process.exit(1);
            break;
          default:
            throw error;
        }
      }

}


module.exports = Application;