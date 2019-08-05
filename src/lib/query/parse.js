'use strict'

const {lex} = require('./lex')

exports.parse = function parse (schema, queryString) {
  const tokens = lex(queryString)

  // console.log(tokens)

  let tokenIdx = -1

  const shift = () => {
    tokenIdx += 1
    if (!tokens[tokenIdx]) {
      throw new Error('no more tokens')
    }
    return tokens[tokenIdx]
  }

  const peek = (offset = 1) => {
    return tokens[tokenIdx + offset]
  }

  function parseId () {
    // console.log('parseId', peek())

    const token = shift()

    if (token.type !== 'id') {
      throw new Error(`parseId: unexpected token (type=${token.type})`)
    }

    if (peek().type === 'leftParen') {
      // function
      shift()
      return {
        type: 'function',
        name: token.value,
        arguments: parseArguments()
      }
    }

    return {type: 'id', value: token.value}
  }

  function parseNumber () {
    // console.log('parseNumber', peek())

    const token = shift()

    if (token.type !== 'number') {
      throw new Error(`parseNumber: unexpected token (type=${token.type})`)
    }

    return {type: 'number', value: Number(token.value)}
  }

  function parseString () {
    // console.log('parseString', peek())

    const token = shift()

    if (token.type !== 'string') {
      throw new Error(`parseString: unexpected token (type=${token.type})`)
    }

    return {type: 'string', value: token.value}
  }

  function parseExpression () {
    // console.log('parseExpression', peek())

    const token = peek()

    let node

    if (token.type === 'id') {
      node = parseId()
    }

    if (token.type === 'number') {
      node = parseNumber()
    }

    if (token.type === 'string') {
      node = parseString()
    }

    if (token.type === 'unaryOperator') {
      shift()
      return {
        type: 'unaryExpression',
        operator: token.value,
        argument: parseExpression()
      }
    }

    if (peek().type === 'logicalOperator') {
      const operator = shift().value
      return {
        type: 'logicalExpression',
        operator,
        left: node,
        right: parseExpression()
      }
    }

    return node
  }

  function parseProjection () {
    const node = {type: 'projection', members: []}

    while (true) {
      if (peek().type === 'id' && peek(2).type === 'colon') {
        const id = shift()
        shift() // colon
        node.members.push({
          type: 'member',
          source: parseExpression(),
          target: {type: 'id', value: id.value}
        })
      } else if (
        peek().type === 'id' &&
        peek(2).type === 'arrow' &&
        peek(3).type === 'leftBrace'
      ) {
        const id = shift()
        shift() // arrow
        shift() // leftBrace
        node.members.push({
          type: 'member',
          source: {
            type: 'pipe',
            pipe: [{type: 'dereference', id: id.value}, parseProjection()]
          },
          target: {type: 'id', value: id.value}
        })
      } else if (peek().type === 'id' && peek(2).type === 'arrow') {
        const id = shift()
        shift() // arrow
        node.members.push({
          type: 'member',
          source: {type: 'dereference', id: id.value},
          target: {type: 'id', value: id.value}
        })
      } else if (peek().type === 'id' && peek(2).type === 'leftBrace') {
        const id = shift()
        shift() // leftBrace
        node.members.push({
          type: 'member',
          source: {
            type: 'pipe',
            pipe: [{type: 'id', value: id.value}, parseProjection()]
          },
          target: {type: 'id', value: id.value}
        })
      } else if (peek().type === 'id') {
        const id = shift()
        node.members.push({
          type: 'member',
          source: {type: 'id', value: id.value},
          target: {type: 'id', value: id.value}
        })
      } else if (peek().type === 'rightBrace') {
        shift()
        return node
      } else {
        throw new Error(
          `parseProjection: unexpected token (curr=${peek().type} next=${
            peek(2).type
          })`
        )
      }

      if (peek().type === 'comma') {
        shift()
      }

      if (peek().type === 'rightBrace') {
        shift()
        return node
      }
    }
  }

  function _idToTypeOperator (id) {
    const docType = schema.types.find(t => t.key === id.value)

    // console.log(docType)

    if (docType) {
      return {
        type: 'logicalExpression',
        operator: '==',
        left: {type: 'id', value: '_type'},
        right: {type: 'string', value: id.value}
      }
    }

    return id
  }

  function parseArguments () {
    // console.log('parseArguments', peek())

    const token = peek()

    if (token.type === 'rightParen') {
      shift()
      return []
    }

    throw new Error(`parseArguments: unexpected token (type=${token.type})`)
  }

  function parsePipeItem () {
    // console.log('parsePipeItem', peek())

    const token = peek()

    if (token.type === 'leftBracket') {
      shift()
      const filterNode = {type: 'filter', expression: parseExpression()}
      if (filterNode.expression.type === 'id') {
        filterNode.expression = _idToTypeOperator(filterNode.expression)
      } else if (filterNode.expression.type === 'logicalExpression') {
        if (filterNode.expression.left.type === 'id') {
          filterNode.expression.left = _idToTypeOperator(
            filterNode.expression.left
          )
        }
        if (filterNode.expression.right.type === 'id') {
          filterNode.expression.right = _idToTypeOperator(
            filterNode.expression.right
          )
        }
      }
      if (peek().type !== 'rightBracket') {
        throw new Error(`parsePipeItem: unexpected token (type=${peek().type})`)
      }
      shift()
      return filterNode
    }

    if (token.type === 'leftBrace') {
      shift()
      const projectionNode = parseProjection()
      // if (peek().type !== 'rightBrace') {
      //   throw new Error(`parsePipeItem: unexpected token (type=${peek().type})`)
      // }
      // shift()
      return projectionNode
    }

    return parseExpression()
  }

  function parseQuery () {
    const node = {type: 'query', pipe: []}

    while (true) {
      const pipeItem = parsePipeItem()
      node.pipe.push(pipeItem)
      if (peek().type === 'pipe') {
        shift()
      } else if (peek().type === 'eof') {
        // done
        return node
      } else {
        throw new Error(`parseQuery: unexpected token (type=${peek().type})`)
      }
    }
  }

  return parseQuery()
}
