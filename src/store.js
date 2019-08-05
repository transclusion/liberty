export function createStore (schema) {
  let schemaId = null

  async function sync () {
    const res = await fetch('http://localhost:8081/sync', {
      headers: {'content-type': 'application/json'},
      method: 'post',
      body: JSON.stringify({schema})
    })

    const payload = await res.json()

    schemaId = payload.schemaId
  }

  async function runQuery (query) {
    if (!query) {
      throw new Error('no query')
    }

    if (!schemaId) {
      await sync()
    }

    const res = await fetch(`http://localhost:8081/query`, {
      headers: {'content-type': 'application/json'},
      method: 'post',
      body: JSON.stringify({query, schemaId})
    })

    const payload = await res.json()

    if (payload['data']) {
      return payload.data
    }

    throw new Error(payload.message || 'empty result')
  }

  return {runQuery, schema}
}
