'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const getObjectHash = require('object-hash')
const parseQuery = require('../lib/query/parse').parse
const evalQuery = require('../lib/query/eval').evalQuery
const createDb = require('./db').create

const api = express()
const db = createDb({projectId: 'dev'})

function getSchemaId (schema) {
  return getObjectHash(schema)
}

api.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})

api.get('/', (req, res) => {
  res.json({message: 'ok'})
})

api.post('/sync', [bodyParser.json()], (req, res) => {
  const payload = req.body
  const {schema} = payload
  const schemaId = getSchemaId(schema)

  db.schemaMap[schemaId] = schema

  res.json({schemaId})
})

api.post('/query', [bodyParser.json()], (req, res) => {
  try {
    const payload = req.body
    const {schemaId} = payload
    const schema = db.schemaMap[schemaId]

    if (schema) {
      const query = parseQuery(schema, payload.query)
      const result = evalQuery(schema, db.records, query)
      res.json(result)
      return
    } else {
      res.status(500)
      res.json({message: 'schema not found'})
    }
  } catch (err) {
    console.log(err)
    res.status(500)
    res.json({message: err.message})
  }
})

api.listen(8081, () => {
  console.log(`API listening on http://localhost:8081`)
})
