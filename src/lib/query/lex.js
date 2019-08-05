'use strict'

function isLowerCase (chr) {
  return chr >= 'a' && chr <= 'z'
}

function isUpperCase (chr) {
  return chr >= 'A' && chr <= 'Z'
}

function isAlpha (chr) {
  return isLowerCase(chr) || isUpperCase(chr)
}

function isNumeric (chr) {
  return chr >= '0' && chr <= '9'
}

function isIdStart (chr) {
  return isAlpha(chr) || chr === '_'
}

function isId (chr) {
  return isAlpha(chr) || isNumeric(chr) || chr === '_' || chr === '$'
}

function isWhitespace (chr) {
  return /\s/.test(chr)
}

function lexEOF (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexEOF
  }

  // eof
  if (chr === undefined) {
    lexer.emit('eof')
    return null
  }

  // pipe
  if (chr === '|') {
    lexer.end += 1
    lexer.emit('pipe')
    lexer.pushState(lexEOF)
    return lexPipeItem
  }

  // start of projection
  if (chr === '{') {
    lexer.emit('pipe')
    lexer.pushState(lexEOF)
    return lexPipeItem
  }

  throw new Error(`lexEOF: unexpected character: ${chr}`)
}

function lexPipeItem (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexPipeItem
  }

  // start of id
  if (isIdStart(chr)) {
    lexer.end += 1
    while (isId(lexer.input[lexer.end])) lexer.end += 1
    lexer.emit('id')
    lexer.pushState(lexAfterPipeItem)
    return lexAfterId
  }

  // start of expression
  if (chr === '"' || chr === "'" || chr === '!') {
    lexer.pushState(lexAfterPipeItem)
    return lexExpression
  }

  // start of projection
  if (chr === '{') {
    lexer.end += 1
    lexer.emit('leftBrace')
    lexer.pushState(lexAfterPipeItem)
    return lexProjection
  }

  // start of filter
  if (chr === '[') {
    lexer.end += 1
    lexer.emit('leftBracket')
    lexer.pushState(lexAfterFilterExpression)
    return lexExpression
  }

  return lexer.popState()
}

function lexAfterPipeItem (lexer) {
  return lexer.popState()
}

function lexAfterFilterExpression (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexAfterFilterExpression
  }

  // right bracket
  if (chr === ']') {
    lexer.end += 1
    lexer.emit('rightBracket')
    return lexAfterPipeItem
  }

  throw new Error(`lexAfterFilterExpression: unexpected character: ${chr}`)
}

function lexAfterId (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexAfterId
  }

  // left paren
  if (chr === '(') {
    lexer.end += 1
    lexer.emit('leftParen')
    return lexArguments
  }

  // dereference
  if (lexer.lookAhead(2) === '->') {
    lexer.end += 2
    lexer.emit('arrow')
    return lexDereference
  }

  return lexer.popState()
}

function lexDereference (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexDereference
  }

  if (chr === '{') {
    lexer.end += 1
    lexer.emit('leftBrace')
    // lexer.pushState(lexAfterPipeItem)
    return lexProjection
  }

  return lexer.popState()
  // throw new Error(`lexDereference: unexpected character: ${chr}`)
}

function lexArguments (lexer) {
  const chr = lexer.input[lexer.start]

  // right paren
  if (chr === ')') {
    lexer.end += 1
    lexer.emit('rightParen')
    return lexer.popState()
  }

  throw new Error(`lexArguments: unexpected character: ${chr}`)
}

function lexProjection (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexProjection
  }

  // start of id
  if (isIdStart(chr)) {
    lexer.pushState(lexProjectionAfterKey)
    return lexExpression
  }

  // right brace
  if (chr === '}') {
    lexer.end += 1
    lexer.emit('rightBrace')
    return lexer.popState()
  }

  throw new Error(`lexProjection: unexpected character: ${chr}`)
}

function lexProjectionAfterKey (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexProjectionAfterKey
  }

  // end projection
  if (chr === '}') {
    lexer.end += 1
    lexer.emit('rightBrace')
    return lexer.popState()
  }

  // comma
  if (chr === ',') {
    lexer.end += 1
    lexer.emit('comma')
    return lexProjection
  }

  // colon
  if (chr === ':') {
    lexer.end += 1
    lexer.emit('colon')
    lexer.pushState(lexAfterProjectionValue)
    return lexExpression
  }

  // start of nested projection
  if (chr === '{') {
    lexer.end += 1
    lexer.emit('leftBrace')
    lexer.pushState(lexAfterProjectionValue)
    return lexProjection
  }

  throw new Error(`lexProjectionAfterKey: unexpected character: ${chr}`)
}

function lexString (lexer) {
  while (true) {
    if (lexer.input[lexer.end] === lexer.delimiter) {
      lexer.emit('string')
      lexer.consume()
      return lexer.popState()
    }

    lexer.end += 1
  }
}

function lexAfterProjectionValue (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexAfterProjectionValue
  }

  // right brace
  if (chr === '}') {
    lexer.end += 1
    lexer.emit('rightBrace')
    return lexer.popState()
  }

  // comma
  if (chr === ',') {
    lexer.end += 1
    lexer.emit('comma')
    return lexProjection
  }

  throw new Error(`lexAfterProjectionValue: unexpected character: ${chr}`)
}

function lexExpression (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexExpression
  }

  // id
  if (isIdStart(chr)) {
    lexer.end += 1
    lexer.pushState(lexAfterStatement)
    return lexId
  }

  // string
  if (chr === '"' || chr === "'") {
    lexer.consume()
    lexer.delimiter = chr
    lexer.pushState(lexAfterStatement)
    return lexString
  }

  // number
  if (isNumeric(chr)) {
    lexer.end += 1
    lexer.pushState(lexAfterStatement)
    return lexNumber
  }

  // unary operator
  if (chr === '!') {
    lexer.end += 1
    lexer.emit('unaryOperator')
    return lexExpression
  }

  throw new Error(`lexExpression: unexpected character: ${chr}`)
}

function lexNumber (lexer) {
  while (isNumeric(lexer.input[lexer.end])) lexer.end += 1

  // decimal
  if (lexer.input[lexer.end] === '.') {
    lexer.end += 1
    while (isNumeric(lexer.input[lexer.end])) lexer.end += 1
  }

  lexer.emit('number')

  return lexer.popState()
}

function lexId (lexer) {
  while (isId(lexer.input[lexer.end])) lexer.end += 1

  lexer.emit('id')

  return lexAfterId
}

function lexAfterStatement (lexer) {
  const chr = lexer.input[lexer.start]

  // ignore whitespace
  if (isWhitespace(chr)) {
    lexer.consume()
    return lexAfterStatement
  }

  // logical operator
  if (chr === '<' || chr === '>' || chr === '=' || chr === '|' || chr === '&') {
    if (['==', '<=', '>=', '||', '&&'].indexOf(lexer.lookAhead(2)) > -1) {
      lexer.end += 2
      lexer.emit('logicalOperator')
      return lexExpression
    }

    if (['<', '>'].indexOf(lexer.lookAhead(1)) > -1) {
      lexer.end += 1
      lexer.emit('logicalOperator')
      return lexExpression
    }
  }

  return lexer.popState()
}

exports.lex = function lex (input) {
  const tokens = []
  const len = input.length
  const stateStack = [lexEOF]

  let state = lexPipeItem

  const emit = type => {
    const token = {
      type,
      value: lexer.start >= len ? -1 : input.slice(lexer.start, lexer.end)
    }
    tokens.push(token)
    lexer.start = lexer.end
  }

  const consume = (len = 1) => {
    lexer.start = lexer.end = lexer.start + len
  }

  const pushState = newState => {
    stateStack.push(newState)
    return newState
  }

  const popState = () => {
    state = stateStack.pop()
    if (!state) throw new Error('state stack is empty')
    return state
  }

  const lookAhead = len => {
    return lexer.input.substr(lexer.start, len)
  }

  const lexer = {
    emit,
    consume,
    input,
    pushState,
    popState,
    lookAhead,
    start: 0,
    end: 0
  }

  while (state) {
    // console.log(
    //   state.name,
    //   input[lexer.start],
    //   `stateStack=${stateStack.length}`
    // )
    state = state(lexer)
  }

  if (stateStack.length) {
    throw new Error(`stack is not empty`)
  }

  if (lexer.start === len) {
    return tokens
  }

  throw new Error(
    `Did not finish lexing: input=\`${input}\` start=${lexer.start} end=${lexer.end} length=${len}`
  )
}
