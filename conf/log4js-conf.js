module.exports = {
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/wx.log', category: 'wx' }
  ]
}