/*
 * @Author: jian.lu
 * @Date: 2020-03-30 16:30:46
 * @LastEditors: jian.lu
 * @LastEditTime: 2020-03-31 14:07:07
 * @Description: 翻译key值方法
 */
var crypto = require('crypto')
var axios = require('axios')
var Qs = require("qs")
var { APP_ID, PASSWORD } = require('./config')

function guid2() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
}

var salt = guid2()

var url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
async function getPost(q) {
  // digest在一个实例中只能使用一次，所以使用时需要再次创建实例crypto.createHash('md5')
  var sign = crypto.createHash('md5').update(`${APP_ID}${q}${salt}${PASSWORD}`).digest("hex")
  let data = {
    q,
    from:'zh',
    to: 'en',
    appid: APP_ID,
    salt,
    sign
  }
  let response = await axios({
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    url: url,
    data: Qs.stringify(data)
  });
  return response.data
}
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
async function translate(value) {
  let val = await getPost(value)
  if (val.error_code != undefined) {
    await sleep(1000);
     val = await getPost(value)
  }
  let { trans_result } = val
  if (trans_result[0]) {
    let key = trans_result[0].dst
    let keys = key.split(' ')
    for (let i = 0; i < keys.length; i++) {
      let str = keys[i]
      if (i === 0) {
        keys[i] = str.replace(str[0], str[0].toLowerCase())
        key = keys[i]
      } else {
        keys[i] = str.replace(str[0], str[0].toUpperCase())
        key += keys[i]
      }
    }
    return key
    // console.log(key)
  }
}

module.exports = {
  translate
}
