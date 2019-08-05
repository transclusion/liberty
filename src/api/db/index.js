'use strict'

const path = require('path')

exports.create = function create ({projectId}) {
  return {
    records: require(path.resolve(
      __dirname,
      'data',
      projectId,
      'records.json'
    )),
    schemaMap: require(path.resolve(
      __dirname,
      'data',
      projectId,
      'schemaMap.json'
    ))
  }
}
