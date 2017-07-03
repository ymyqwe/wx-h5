// 微信配置
const wxConstants = require('./constants/weixin-constants')

// mongodb配置
var MongoClient = require('mongodb').MongoClient;
var Db = require('mongodb').Db;

// redis配置
const redisConstants = require('./constants/redis-constants');
var redis = require('redis'),
    redisClient = redis.createClient(redisConstants)


// 日志系统
const log4jsConf = require('./conf/log4js-conf')
var log4js = require('log4js');
log4js.configure(log4jsConf);
var logger = log4js.getLogger('wx');
logger.setLevel('INFO');

// node基础配置
const http = require('http');
var request = require('request');
var URL = require('url-parse');

http.createServer((req, res) => {
    logger.info(req.method, req.url);
    if (req.url === '/api/jsApi') {
      console.log('jsAPi');
      getAccessToken()
        .then(access_token => logger.info('access_token', access_token),
              (err)=>{
                logger.error(err)
                logger.info('request on ', wxConstants.url)
                request(wxConstants.url, (error, response, body)=> {
                  body = JSON.parse(body);
                  logger.info(body);
                  if (body.errcode) {
                    logger.trace(body.errmsg)
                  } else if (body.access_token) {
                    logger.info('access_token', body.access_token);
                    redisClient.set('access_token', body.access_token, 'EX', 7200);
                  }
                })
            })
    }
    res.end('hello world');
}).listen(9000);


// 从redis中获取access_token，如果没有则重新调微信接口
function getAccessToken() {
  return new Promise((resolve, reject) => {
    redisClient.get('access_token', (err, reply) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        if (!reply) {
          reject('no access_token')
        } else {
          resolve(reply);
        }
      }
    })
  })
}

console.log('Server running at port:9000');
// var url = 'mongodb://yumingyuan.me:27017/weixin';

// var insertDocuments = function(db, callback) {
//   // Get the documents collection
//   var collection = db.collection('documents');
//   // Insert some documents
//   collection.insertMany([
//     {a : 1}, {a : 2}, {a : 3}
//   ], function(err, result) {
//     assert.equal(err, null);
//     assert.equal(3, result.result.n);
//     assert.equal(3, result.ops.length);
//     console.log("Inserted 3 documents into the collection");
//     callback(result);
//   });
// }

// var updateDocument = function(db, callback) {
//   // Get the documents collection
//   var collection = db.collection('documents');
//   // Update document where a is 2, set b equal to 1
//   collection.updateOne({ a : 2 }
//     , { $set: { b : 1 } }
//     ,{ upsert: true}
//     ,function(err, result) {
//     assert.equal(err, null);
//     assert.equal(1, result.result.n);
//     console.log("Updated the document with the field a equal to 2");
//     callback(result);
//   });
// }

// function cb(data) {
//   console.log('succeeded');
// }
// MongoClient.connect(url, (err, db) => {
//   assert.equal(null, err);
//   console.log('Connect to Server');;

//   // insertDocument(db, ()=>{console.log('hahaha');})
//   // insertDocuments(db, cb)
//   updateDocument(db,cb)
// })

