// express
var express = require('express')
var app = express()

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

app.route('/api/js_ticket')
  .get((req, res) => {
    logger.info(req.method, req.url, req.query, 'ip ', req.ip);
    getAccessToken()
      .then(access_token => {
        getJsTicket(access_token)
          .then(jsapi_ticket => {
            let response = generateSignature({url: req.query.url, jsapi_ticket: jsapi_ticket})
            res.json(response);
            logger.info('signature', response);
          }, (err)=>{console.log(err);}).catch(reason=>console.log(reason))
      }, (err)=>{ console.log(err);}).catch(reason=>console.log(reason))
  })

app.route('/api/userInfo/')
  .get((req, res) => {
    logger.info(req.method, req.url, req.query, 'ip ', req.ip);
    getUserInfo(req.query.code).then(
      (user) => res.json(user),
      () => {}
    )
  })

app.route('/api/wxLogin/')
  .get((req, res) => {
    logger.info(req.method, req.url, req.query, 'ip ', req.ip);
    if (!req.query.code) {
      let redirect_uri = req.query.next;
      let wechatUri = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${wxConstants.AppID}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
      res.redirect(wechatUri);
    } else {
      // logger.info('code', req.query.code)
      // getUserInfo(req.query.code).then(
      //   () =>
      // )
    }
  })

app.route(/.*/g)
  .get((req, res) => {
    logger.info(req.url, req.method, req.ip);
    res.end('unknown request')
  })


app.listen(9000, function () {
  console.log('app listening on port 9000!')
})

function getUserInfo(code) {
  return new Promise((resolve, reject) => {
    request(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${wxConstants.AppID}&secret=${wxConstants.AppSecret}&code=${code}&grant_type=authorization_code`,
      (err, response, body) => {
        body = JSON.parse(body);
        logger.info('user_info', typeof(body), body)
        resolve(body)
      }
    )
  })
}

function generateSignature(_params) {
  let noncestr = 'ilovexiuxiu',
      timestamp = parseInt(new Date().getTime() / 1000),
      url = decodeURIComponent(_params.url);
  logger.info(`jsapi_ticket=${_params.jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`);
  let response = {
    appId: wxConstants.AppID,
    timestamp: timestamp,
    noncestr: noncestr,
    signature: sha1(`jsapi_ticket=${_params.jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`),
  }
  return response
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
        logger.info('ticket_reply', typeof(reply), reply)
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
            reject(body.errmsg);
          } else if (body.access_token) {
            logger.info('access_token', body.access_token);
            redisClient.set('access_token', body.access_token, 'EX', 7200);
            resolve(body.access_token);
          }
        })
      } else {
        logger.info('token_reply', typeof(reply), reply)
        resolve(reply);
      }
    })
  })
}

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

