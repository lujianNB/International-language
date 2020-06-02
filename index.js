/**
 * Input prompt example
 */

'use strict'
const program = require('commander')
const { init } = require('./functions')

program
.version('0.0.1')
.option('-C, --chdir <path>', 'change the working directory')
.option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
.option('-T, --no-tests', 'ignore test hook')

program
.command('add')
.description('run remote setup commands')
.action(function() {
  init()
})

program.parse(process.argv)
