const redisConstants = require('./constants/redis-cons');

var redis = require('redis'),
    client = redis.createClient(redisConstants)


client.set('a', 2);
client.quit();
