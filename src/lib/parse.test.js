const {parse} = require('./parse')

const schema = {
  type: 'schema',
  types: [
    {type: 'document', key: 'Movie', fields: [{type: 'string', key: 'title'}]},
    {type: 'document', key: 'Person', fields: [{type: 'string', key: 'name'}]}
  ]
}

describe('parse', () => {
  it('should parse query with reference projection', () => {
    const ast = parse(schema, `{ ref-> { key } }`)
    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'projection',
          members: [
            {
              type: 'member',
              source: {
                type: 'pipe',
                pipe: [
                  {type: 'dereference', id: 'ref'},
                  {
                    type: 'projection',
                    members: [
                      {
                        type: 'member',
                        source: {type: 'id', value: 'key'},
                        target: {type: 'id', value: 'key'}
                      }
                    ]
                  }
                ]
              },
              target: {type: 'id', value: 'ref'}
            }
          ]
        }
      ]
    })
  })

  it('should parse query with object projection', () => {
    const ast = parse(schema, `{ object { key } }`)
    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'projection',
          members: [
            {
              type: 'member',
              source: {
                type: 'pipe',
                pipe: [
                  {type: 'id', value: 'object'},
                  {
                    type: 'projection',
                    members: [
                      {
                        type: 'member',
                        source: {type: 'id', value: 'key'},
                        target: {type: 'id', value: 'key'}
                      }
                    ]
                  }
                ]
              },
              target: {type: 'id', value: 'object'}
            }
          ]
        }
      ]
    })
  })

  it('should parse query with dereference expression', () => {
    const ast = parse(schema, `[ Movie ] { name: title, director-> }`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '==',
            left: {type: 'id', value: '_type'},
            right: {type: 'string', value: 'Movie'}
          }
        },
        {
          type: 'projection',
          members: [
            {
              type: 'member',
              source: {type: 'id', value: 'title'},
              target: {type: 'id', value: 'name'}
            },
            {
              type: 'member',
              source: {type: 'dereference', id: 'director'},
              target: {type: 'id', value: 'director'}
            }
          ]
        }
      ]
    })
  })

  it('should parse query with unary expression', () => {
    const ast = parse(schema, `!0`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'unaryExpression',
          operator: '!',
          argument: {type: 'number', value: 0}
        }
      ]
    })
  })

  it('should parse query with string', () => {
    const ast = parse(schema, `'foo'`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [{type: 'string', value: 'foo'}]
    })
  })

  it('should parse filter with string', () => {
    const ast = parse(schema, `[ name == "Marius" ]`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '==',
            left: {type: 'id', value: 'name'},
            right: {type: 'string', value: 'Marius'}
          }
        }
      ]
    })
  })

  it('should parse query with projection', () => {
    const ast = parse(schema, `{ foo: "bar" }`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'projection',
          members: [
            {
              type: 'member',
              source: {type: 'string', value: 'bar'},
              target: {type: 'id', value: 'foo'}
            }
          ]
        }
      ]
    })
  })

  it('should parse query with type filter and projection', () => {
    const ast = parse(
      schema,
      `[Person] | {
        _type,
        name,
        foo: "bar"
      }`
    )

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '==',
            left: {type: 'id', value: '_type'},
            right: {type: 'string', value: 'Person'}
          }
        },
        {
          type: 'projection',
          members: [
            {
              type: 'member',
              source: {type: 'id', value: '_type'},
              target: {type: 'id', value: '_type'}
            },
            {
              type: 'member',
              source: {type: 'id', value: 'name'},
              target: {type: 'id', value: 'name'}
            },
            {
              type: 'member',
              source: {type: 'string', value: 'bar'},
              target: {type: 'id', value: 'foo'}
            }
          ]
        }
      ]
    })
  })

  it('should parse query with type filter', () => {
    const ast = parse(schema, `[Person]`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '==',
            left: {type: 'id', value: '_type'},
            right: {type: 'string', value: 'Person'}
          }
        }
      ]
    })
  })

  it('should parse filter with `>=` operator', () => {
    const ast = parse(schema, `[20 >= 10]`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '>=',
            left: {type: 'number', value: 20},
            right: {type: 'number', value: 10}
          }
        }
      ]
    })
  })

  it('should parse filter with `||` operator', () => {
    const ast = parse(schema, `[Movie || Person]`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '||',
            left: {
              type: 'logicalExpression',
              operator: '==',
              left: {type: 'id', value: '_type'},
              right: {type: 'string', value: 'Movie'}
            },
            right: {
              type: 'logicalExpression',
              operator: '==',
              left: {type: 'id', value: '_type'},
              right: {type: 'string', value: 'Person'}
            }
          }
        }
      ]
    })
  })

  it('should parse query with count call', () => {
    const ast = parse(schema, `[Person] | count()`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '==',
            left: {type: 'id', value: '_type'},
            right: {type: 'string', value: 'Person'}
          }
        },
        {
          type: 'function',
          name: 'count',
          arguments: []
        }
      ]
    })
  })

  it('should parse query with projection', () => {
    const ast = parse(schema, `[Movie] | { _type, name: title }`)

    expect(ast).toEqual({
      type: 'query',
      pipe: [
        {
          type: 'filter',
          expression: {
            type: 'logicalExpression',
            operator: '==',
            left: {type: 'id', value: '_type'},
            right: {type: 'string', value: 'Movie'}
          }
        },
        {
          type: 'projection',
          members: [
            {
              type: 'member',
              source: {type: 'id', value: '_type'},
              target: {type: 'id', value: '_type'}
            },
            {
              type: 'member',
              source: {type: 'id', value: 'title'},
              target: {type: 'id', value: 'name'}
            }
          ]
        }
      ]
    })
  })
})
