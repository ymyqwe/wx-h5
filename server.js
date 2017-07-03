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
var sha1 = require('sha1');
const { parse, URLSearchParams } = require('url');

http.createServer((req, res) => {
    logger.info(req.method, req.url);
    let urlObj = parse(req.url, true)
    switch (urlObj.pathname) {
      case '/api/access_token':
        getAccessToken()
          .then(access_token => {
            getJsTicket(access_token)
              .then(jsapi_ticket => {
                res.end(generateSignature({url: urlObj.query.url, jsapi_ticket: jsapi_ticket}))
              }, ()=>{})
          }, ()=>{})
        break;
      case 'api/js_ticket':
        break;
      default:
        console.log('default');
    }
    if (req.url === '/api/access_token') {

    }
    res.end('hello world');
}).listen(9000);

function generateSignature(_params) {
  let noncestr = 'ilovexiuxiu',
      timestamp = parseInt(new Date().getTime() / 1000);
  return sha1(`jsapi_ticket=${_params.jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${_params.url}`)
}

function getJsTicket(access_token) {
  return new Promise((resolve, reject) => {
    redisClient.get('jsapi_ticket', (err, reply) => {
      if (err || !reply) {
        request(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&type=jsapi`,
          (err, response, body) => {
            body = JSON.parse(body);
            logger.info('jsapi_ticket body', body);
            if (body.errcode === 0) {
              logger.info('jsapi_ticket', body.ticket);
              redisClient.set('jsapi_ticket', body.ticket, 'EX', 7200);
              resolve(body.ticket);
            } else {
              logger.error(body.errmsg)
              reject(body.errmsg);
            }
          }
        )
      } else {
        resolve(reply);
      }
    })
  })
}

// 从redis中获取access_token，如果没有则重新调微信接口
function getAccessToken() {
  return new Promise((resolve, reject) => {
    redisClient.get('access_token', (err, reply) => {
      if (err || !reply) {
        logger.error(err);
        request(wxConstants.url, (error, response, body)=> {
          body = JSON.parse(body);
          logger.info('access_token body', body);
          if (body.errcode) {
            logger.error(body.errmsg)
            reject();
          } else if (body.access_token) {
            logger.info('access_token', body.access_token);
            redisClient.set('access_token', body.access_token, 'EX', 7200);
            resolve(body.access_token);
          }
        })
        reject(err);
      } else {
        resolve(reply);
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

