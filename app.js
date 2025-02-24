const {join} = require('path');
const express = require('express');
const sequelize = require('./configs/sequelize.config');
const autoBind = require('auto-bind').default;
const logger = require('morgan');
const rfs = require('rotating-file-stream');
const router = require('./routes');

class Application{

    app;
    PORT;
    server;
    debugHttp;
    debugDb;

    constructor(){
        console.log('DEBUG is:', process.env.DEBUG);
        autoBind(this);
        this.setDebugger()
        this.setupExpress()
        this.setLogger()
        this.setupDatabase()
        this.setupRoutes()
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

    setupDatabase(){
        sequelize.authenticate()
        .then(()=>this.debugDb('Connected to MySQL successfully'))
        .catch(err=>{
            this.debugDb('Connecting to database failed -> ',err.original.sqlMessage)
            if(err) process.exit(1);
        })

        require('./modules/product/product.model');

        sequelize.sync({force:true, alter: true})
    }

    setDebugger(){
        this.debugHttp = require('debug')('App');
        this.debugDb = require('debug')('Database');
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