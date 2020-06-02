/*
 * @Author: jian.lu
 * @Date: 2020-03-11 09:14:09
 * @LastEditors: jian.lu
 * @LastEditTime: 2020-04-13 15:45:24
 * @Description: 
 */

// 初始化问题
const init_questions = [
  {
    type: 'input',
    name: 'dir',
    message: "请输入要查找的目录"
  },
  {
    type: 'input',
    name: 'file_name',
    message: "请输入语言包文件名",
    transformer: function (text, answers, flags) {
      if (text && text.includes('.js')) {
        return text
      } else {
        return text + '.js'
      }
    }
  }
]

// 添加key
const addKey = function (text, advice) {
  return [
    {
      type: 'input',
      name: 'key',
      message: `请输入"${text}"对应的key，建议：${advice}`
    }
  ]
}

// 是否启用新的命名空间
const addNewObj = function (text) {
  return [
    {
      type: 'input',
      name: 'key',
      message: `是否启用新的命名空间，当前命名空间是："${text}"`
    }
  ]
}


module.exports = {
  init_questions,
  addKey,
  addNewObj
}