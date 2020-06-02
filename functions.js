/*
 * @Author: jian.lu
 * @Date: 2020-03-11 14:54:05
 * @LastEditors: jian.lu
 * @LastEditTime: 2020-04-13 16:48:44
 * @Description: 
 */
const path = require('path')
const fs = require('fs')
const { addNewObj, addKey } = require('./questions')
const inquirer = require('inquirer')
const { translate } = require('./translate/index')

const config = {
  // 项目地址
  project_path: 'C:/Users/admin/Desktop/ding/xbb-pro-dingtalk-front',
  // 要提取中文的目录
  dir_path: '/src/views/detail',
  // 要修改添加的语言包路径
  lang_path: '/src/lang/zh/views_detail.js',
  // 命名空间
  nameSpace: ''
}

// 当前语言包内容
let currentLangContent = {}
// 当前正在提取的文件内容
let currentFileContent = {}
let currentFilePath = ''

 /**
 * 继电器
 * @param {Array} args 一个由字符串组成的数组
 */
function* generator (args) {
  for (let text of args) {
    yield text
  }
}

/**
 * 使用Generator输文件中匹配到的所有内容
 * @param {Generator} gen 
 * @param {function} cb 回调
 * @param {Generator*} cb_args 回调参数
 */
function getText (gen, cb, cb_args, container) {
  const next = gen.next()
  let reg = ''
  if (!next.done) {
    const { value, type } = next.value
    let searchChange = (val = '点击频率过快') => { 
      inquirer.prompt(addKey(value, val)).then(answers => {
        // 如果出现中文问号或者是竖线|时，需要对字符串进行转义才能新建正则对象
        let valueRegStr = value.replace(/[\?]/g, '\\?').replace(/[\|]/g, '\\|')
        if (answers.key) {
          // 替换组件内容
          switch (type) {
            case 'js':
              reg = new RegExp(`[?<=\'|\`]${valueRegStr}[?=\'|\`]`)
              currentFileContent = currentFileContent.replace(reg, `i18n.t('${container + '.' + answers.key}')`)
              break
            case 'dom':
              // 使用new RegExp时\n等规则使用要注意再加一个转义符\\n才行
              reg = new RegExp(`(?<=>)\\n*\\s*${valueRegStr}\\n*\\s*(?=<)`)
              // 在dom中存在空格或者换行符时，会出现无法替换的情况，所以此时需要特殊的逻辑处理
              let domArr = currentFileContent.match(reg)
              let domReg = new RegExp(`${valueRegStr}`)
              let domStrArr = domArr.map((item) => {
                return item.replace(domReg, `{{ $t('${container + '.' + answers.key}') }}`)
              })
              domArr.forEach((item, index) => {
                // 转义
                let itemRegStr = item.replace(/[\?]/g, '\\?').replace(/[\|]/g, '\\|')
                let itemReg = new RegExp(`(?<=>)${itemRegStr}(?=<)`)
                currentFileContent = currentFileContent.replace(itemReg, domStrArr[index])
              })
              break
            case 'script':
              reg = new RegExp(`[?<=\'|\`]${valueRegStr}[?=\'|\`]`)
              currentFileContent = currentFileContent.replace(reg, `this.$t('${container + '.' + answers.key}')`)
              break
            case 'property':
              // reg = new RegExp(`(?<=\=\")${value}(?=\")`)
              // 匹配到绑定属性时需要在前面加上冒号
              reg = new RegExp(`(?<=\\s)[A-Za-z0-9\-]+[\=][\"]${valueRegStr}[\"]`)
              let propertyArr = currentFileContent.match(reg)
              let propertyReg = new RegExp(`${valueRegStr}`)
              let propertyStrArr = propertyArr.map((item) => {
                return ':' + item.replace(propertyReg, `$t('${container + '.' + answers.key}')`)
              })
              propertyArr.forEach((item, index) => {
                // 转义
                let itemRegStr = item.replace(/[\?]/g, '\\?').replace(/[\|]/g, '\\|')
                let itemReg = new RegExp(itemRegStr)
                currentFileContent = currentFileContent.replace(itemReg, propertyStrArr[index])
              })
              break
            default:
              console.log('no match')
          }

          // 新增key
          const keys = config.nameSpace.split('.').concat(answers.key.split('.'))
          addNewKey(keys, currentLangContent, value)
        }
        console.log(JSON.stringify(answers, null, '  '))
        getText(gen, cb, cb_args, container)
      })
    }
    translate(value).then((val)=>searchChange(val)).catch(
      () => searchChange()
    )
  } else {
    // 修改语言包内容
    fs.writeFileSync(config.project_path + config.lang_path, `
    module.exports = ${JSON.stringify(currentLangContent)}
      `)
    console.log('语言包替换完成，请检查：', config.lang_path, '\n')

    // 修改目标组件
    fs.writeFileSync(currentFilePath, currentFileContent)
    console.log('组件替换完成，请检查：', currentFilePath, '\n')
    cb(cb_args)
  }
}

/**
 * 使用Generator输出所有文件路径
 * @param {Generator} gen 
 */
function getFilePath (gen) {
  const next = gen.next()
  if (!next.done) {
    console.log(`当前在提取的文件: ${next.value} \n`)
    currentFileContent = fs.readFileSync(path.resolve(next.value), 'utf-8')

    // 是否启用新的命名空间
    inquirer.prompt(addNewObj(config.nameSpace)).then(answers => {
      if (answers.key) {
        config.nameSpace = answers.key
      }
      let container = config.nameSpace
      // 如果文件中没有中文，则跳过
      const textList = findTexts(next.value)
      if (!textList.length) {
        getFilePath(gen)
        return
      }

      const tl = generator(textList)
      getText(tl, getFilePath, gen, container)
    })
  } else {
    console.log('替换完成! \n')
  }
}

/**
 * @description 获取某一目录下所有文件
 * @param {String} path
 * @returns {Array}
 */
async function getAllFiles (dirPath) {
  
  const result = []
  const dir = await fs.opendirSync(dirPath)
  for await (const dirent of dir) {
    if (dirent.isDirectory()) {
      let res=getAllFiles(dirPath + '/' + dirent.name)
      await res.then(r => {
        result.push(...r)
      })
    } else if (dirent.isFile()) {
      result.push(dirPath + '/' + dirent.name)
    }
  }
  return result
}

// 找出文件内的所有中文内容
function findTexts (filePath) {
  currentFilePath = filePath
  const p = path.resolve(filePath)
  let result = []
  try {
    const fileContent = fs.readFileSync(path.resolve(p), 'utf-8')
    if (p.includes('.js')) {
      // 匹配js中的中文
      result = result.concat(formatMatchText(fileContent, /(?<='|`)[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\"]*[\u0391-\uFFE5]+\s*[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\"]*(?='|`)/g, 'js'))
    } else {
      // 匹配js中的中文
      const script = formatMatchText(fileContent, /(?<='|`)[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\"]*[\u0391-\uFFE5]+\s*[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\"]*(?='|`)/g, 'script')

      // 匹配dom中的中文 此处应该[\u0391-\uFFE5]匹配双字节字符（汉字+符号）并为了防止一些人加上了一些半角符，加了特殊的一些常用符号|,|.|?|:|-
      const dom = formatMatchText(fileContent, /(?<=>)\n*\s*[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\s]*[\u0391-\uFFE5]+[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\s]*\n*\s*(?=<)/g, 'dom')

      // 匹配dom中的属性
      const property = formatMatchText(fileContent, /(?<==")[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\s]*[\u0391-\uFFE5]+[\u0391-\uFFE5A-Za-z0-9\,\.\:\-\~\|\?\!\s]*(?=")/g, 'property')

      result = result.concat(script, dom, property)
    }
  } catch (err) {
    console.log(err)
  }
  return result
}

// 格式化匹配到的文本
function formatMatchText (fileContent, reg, type) {
  const arr = fileContent.match(reg) || []
  return arr.map(text => {
    return {
      value: text.trim(),
      type
    }
  })
}

const init = function () {
  // 提取语言包内容
  currentLangContent = require(path.resolve(config.project_path + config.lang_path))
  getAllFiles(config.project_path + config.dir_path).then(data => {
    const fl = generator(data)
    getFilePath(fl)
  })
}

/**
 * 给语言包新增key
 */
function addNewKey (keys, obj, value) {
  if (keys.length) {
    if (!obj[keys[0]]) {
      if (keys.length === 1) {
        obj[keys[0]] = value
      } else {
        obj[keys[0]] = {}
      }
    }
    addNewKey(keys.slice(1), obj[keys[0]], value)
  }
}

module.exports = {
  init
}
