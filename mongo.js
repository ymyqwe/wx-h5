// express
var express = require('express')
var app = express()

// mongoose配置
var mongoose = require('mongoose');
mongoose.connect('mongodb://yumingyuan.me/wechat');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

var userSchema = mongoose.Schema({
  "openid":string,
  "nickname": string,
  // "sex":string,
  // "province":string,
  // "city":string,
  // "country":string,
  // "headimgurl":string,
  // "privilege":string,
  // "unionid": string
})

var user = mongoose.model('wechat_user', userSchema);

var yutou = new user({
  openid: '123',
  nickname: 'yutou'
})

yutou.save((err, yutou) {
  if (err) return console.error(err);
})