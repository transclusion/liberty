function evalDereference (ctx, node) {
  return (
    (node &&
      ctx.scope.find(d => {
        return d._id === node._ref
      })) ||
    undefined
  )
}

function evalProjection (ctx, scope, node) {
  if (!scope) return scope
  const docType = ctx.schema.types.find(t => t.key === scope._type)
  if (!docType) throw new Error(`unknown type: ${scope._type}`)
  return node.members.reduce((curr, node) => {
    if (node.type === 'member') {
      // if (member.value !== '_type' && member.value !== '_id') {
      //   const fieldType = docType.fields.find(t => t.key === member.value)
      //   if (!fieldType) {
      //     throw new Error(`unknown field on ${docType.key}: ${member.value}`)
      //   }
      // }
      // console.log(node)
      curr[node.target.value] = evalNode(ctx, scope, node.source)
      return curr
    } else {
      throw new Error(`unexpected node: ${node.type}`)
    }
  }, {})
}

function evalNode (ctx, scope, node) {
  // console.log('eval', node, scope)

  if (node.type === 'logicalExpression') {
    const left = evalNode(ctx, scope, node.left)
    const right = evalNode(ctx, scope, node.right)
    switch (node.operator) {
      case '||':
        return left || right
      case '&&':
        return left && right
      case '==':
        return left === right
      case '<=':
        return left <= right
      case '>=':
        return left >= right
      case '>':
        return left > right
      case '<':
        return left < right
      default:
        throw new Error(`unexpected logical operator: ${node.operator}`)
    }
  }

  if (node.type === 'id') {
    return scope[node.value]
  }

  if (node.type === 'string' || node.type === 'number') {
    return node.value
  }

  if (node.type === 'unaryExpression') {
    switch (node.operator) {
      case '!':
        return !evalNode(ctx, scope, node.argument)
      default:
        throw new Error(`unexpected unary operator: ${node.operator}`)
    }
  }

  if (node.type === 'dereference') {
    return evalDereference(ctx, scope[node.id])
  }

  if (node.type === 'pipe') {
    return node.pipe.reduce((localScope, pipeItem) => {
      return evalNode(ctx, localScope, pipeItem)
    }, scope)
  }

  if (node.type === 'filter') {
    return scope.filter(doc => {
      return evalNode(ctx, doc, node.expression)
    })
  }

  if (node.type === 'projection') {
    if (Array.isArray(scope)) {
      return scope.map(doc => evalProjection(ctx, doc, node))
    }
    return evalProjection(ctx, scope, node)
  }

  if (node.type === 'function') {
    if (node.name === 'count') {
      return scope.length
    } else {
      throw new Error(`unknown function: ${node.name}`)
    }
  }

  throw new Error(`unexpected node: ${node.type}`)
}

// function execQuery (schema, q) {

// }

exports.evalQuery = function evalQuery (schema, scope, query) {
  const ctx = {schema, scope}
  // let scope = db.records

  // const queryAst = parseQuery(schema, q)

  // console.log(
  //   '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'
  // )
  // console.log(JSON.stringify(queryAst, null, 2))

  for (let i = 0; i < query.pipe.length; i += 1) {
    scope = evalNode(ctx, scope, query.pipe[i])
  }

  return {data: scope, ms: 0, query}
}
