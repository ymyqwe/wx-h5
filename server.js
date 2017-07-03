const wxConstants = require('./constants/weixin-constants')
const redisConstants = require('./constants/redis-constants');
var MongoClient = require('mongodb').MongoClient;
var Db = require('mongodb').Db;
var assert = require('assert');
const http = require('http');
var request = require('request');
var URL = require('url-parse');


var redis = require('redis'),
    redisClient = redis.createClient(redisConstants)

http.createServer((req, res) => {
    console.log(req.method);
    console.log(req.url);

    if (req.url === '/api/jsApi') {
      console.log('jsAPi');
      getAccessToken()
        .then(access_token => console.log('access_token', access_token),
              (err)=>{
                console.log(err);
                console.log(wxConstants.url);
                request(wxConstants.url, (error, response, body)=> {
                  body = JSON.parse(body);
                  if (body.errcode) {

                  } else {
                    redisClient.set('access_token', body.access_token, 'EX', 7200);
                  }
                  console.log(typeof(body));
                  console.log(body["access_token"]);
                })
            })
    }
    res.end('hello world');
}).listen(9000);


function getAccessToken() {
  return new Promise((resolve, reject) => {
    redisClient.get('access_token', (err, reply) => {
      if (err) {
        reject(err);
      } else {
        console.log(reply);
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

