// express
var express = require('express')
var app = express()
var cookieParser = require('cookie-parser')
app.use(cookieParser())

// 微信配置
const wxConstants = require('./constants/weixin-constants')

// mongoose配置
// var mongoose = require('mongoose');
// mongoose.connect('mongodb://yumingyuan.me/wechat');
var mongo = require('./mongo');


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
    logger.info()
    if (req.cookies.openid) {
      mongo.findByOpenId({openid: req.cookies.openid}).then(
        (result) => {
          res.json(result)
        },
        (err)=> console.log(err)
      )
    } else {
      getUserInfo(req.query.code).then(
        (user) => {
          logger.info('user_info', user);
          mongo.findByOpenId({openid: user.openid}).then(
            (result) => {
              if (result) {
                res.cookie('openid',result.openid, { maxAge: 900000, httpOnly: true })
                res.json(result)
              } else {
                mongo.save(user);
                res.cookie('openid',user.openid, { maxAge: 900000, httpOnly: true })
                res.json(user)
              }
            },
            (err)=> console.log(err)
          )
        },
        (err) => {logger.info(err)}
      )
    }
  })

app.route('/api/wxLogin/')
  .get((req, res) => {
    logger.info(req.method, req.url, req.query, 'ip ', req.ip);
    logger.info('cookies', req.cookies)
    if (!req.cookies.openid) {
      res.json({'logined': false})
    } else {
      // logger.info('code', req.query.code)
      // request(`/api/userInfo/?code=${req.query.code}`,
      //   (err, response, body)=> {
      //     console.log('login res', response, body);
      //     res.json(body);
      //   })
      logger.info('find mongo openid', req.cookies.openid)
      mongo.findByOpenId({openid: req.cookies.openid}).then(
        (result) => {
          if (result) {
            console.log('result', typeof(result), result);
            console.log(result['_doc']);
            res.json(Object.assign({logined: true}, result))
          } else {
            res.json({'logined': false})
          }
        },
        (err)=> console.log(err)
      )
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
        if (!body.errmsg) {
          request(`https://api.weixin.qq.com/sns/userinfo?access_token=${body.access_token}&openid=${body.openid}&lang=zh_CN`,
            (err, response, body) => {
              body = JSON.parse(body);
              resolve(body)
            }
          )
        }
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