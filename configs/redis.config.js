const {createClient} = require('redis');

class Redis {
    redisClient;

    constructor(){
        const {REDIS_URL} = process.env;

        // Redis has 16 databases (numbered from 0 to 15)
        this.redisClient = createClient({url: REDIS_URL || "redis://127.0.0.1:6379",database:1});

        this.redisClient.connect() 

        // Redis has 16 databases (numbered from 0 to 15)
        // await this.redisClient.select(1);

        this.redisClient.on("ready",()=>{
            debugRedis('Redis is ready to use.');

            this.redisClient.set(process.env.APP_NAME, new Date().toTimeString())
            .then(reply=>{
                debugRedis(`Value set in Redis: ${reply}`);
            })
            .catch(err=>{
                debugRedis(err);
            })
        })

        this.redisClient.on("error",(err)=>{
            if(err['code'] === 'ECONNREFUSED'){
                debugRedis(`Redis server is not available.\t Address: ${err['address']}\t Port: ${err['port']}`);
            }else{
                debugRedis(err['message']);
            }
            process.exit(1);
        })

        process.on('SIGINT', async () => {
            this.disconnectRedis();
            process.exit();
        });
        
        process.on('SIGTERM', async () => {
            this.disconnectRedis();
            process.exit();
        });
    }


    disconnectRedis(){
        if(this.redisClient){
            try {
                this.redisClient.quit();
                debugRedis("Disconnected from Redis")
            } catch (error) {
                debugRedis('Error while disconnecting Redis:', err)
            }
        }
    }
}


module.exports = new Redis();