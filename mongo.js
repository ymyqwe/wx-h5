// mongoose配置
var mongoose = require('./constants/mongo-constants');
const Schema = mongoose.Schema;

const userSchema = mongoose.Schema({
  "openid":String,
  "nickname": String,
  "sex":Number,
  "province":String,
  "city":String,
  "country":String,
  "headimgurl":String,
  "privilege":String,
  "unionid": String
}, {
  collection: 'wechat_user'
});




userSchema.statics = {
  findByOpenId: function(openid) {
    return this.findOne(openid).exec();
  },

  deleteById: function (wechat_id) {
    return this.remove(wechat_id).exec();
  },

  save: function(model) {
    return new user(model).save();
  }
}

var user = mongoose.model('user', userSchema);

module.exports = user;

//test
if (require.main === module) {
  let data = {
  "openid":"yutoutou",
  "nickname": "yutoutou",
  "sex":1,
  "province":"yutoutou",
  "city":"yutoutou",
  "country":"yutoutou",
  "headimgurl":"yutoutou",
  "privilege":"yutoutou",
  "unionid": "yutoutou"
};
  user.save(data);
}

