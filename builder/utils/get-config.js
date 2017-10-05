const fs = require('fs')
const path = require('path')

module.exports = () => {
  var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../config.json`)), 'utf8')
  var theme = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../theme.json`)), 'utf8')
  return {config, theme}
}
