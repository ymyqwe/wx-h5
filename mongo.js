// express
var express = require('express')
var app = express()

// mongoose配置
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/wechat');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

var userSchema = mongoose.Schema({
  "openid":String,
  "nickname": String,
  // "sex":String,
  // "province":String,
  // "city":String,
  // "country":String,
  // "headimgurl":String,
  // "privilege":String,
  // "unionid": String
})

var user = mongoose.model('wechat_user', userSchema);

var yutou = new user({
  openid: '123',
  nickname: 'yutou'
})

yutou.save((err, yutou) => {

  if (err) return console.error(err);
})