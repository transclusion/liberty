import React, {useEffect, useState} from 'react'
import {render} from 'react-dom'
import {App} from './app'
import {createStore} from './store'
import {DbContext, HistoryContext, StoreContext} from './contexts'
import {create as createDb} from './lib/db/browser'
import schema from './schema'

// async function testDb () {
//   const db = createDb(schema)
//   await db.open()
//   const tx = [db.create({_type: 'Person', name: 'Marius'})]
//   await db.transaction(tx)
//   const result = await db.query(`[Person]`)
//   console.log('result', result)
// }

const store = createStore(schema)

function createHistory () {
  const observers = []

  const current = {
    path: window.location.pathname,
    query: {}
  }

  const pushState = loc => {
    const url = loc.path
    window.history.pushState(null, document.title, url)
    ctx.current = loc
    observers.forEach(observer => observer(loc))
  }

  const replaceState = loc => {
    const url = loc.path
    window.history.replaceState(null, document.title, url)
    ctx.current = loc
    observers.forEach(observer => observer(loc))
  }

  const subscribe = observer => {
    observers.push(observer)
    return () => {
      const idx = observers.indexOf(observer)
      if (idx > -1) {
        observers.splice(idx, 1)
      }
    }
  }

  const ctx = {current, pushState, replaceState, subscribe}

  return ctx
}

const rootElement = document.getElementById('root')
const db = createDb(schema)
const history = createHistory()

function Client () {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    db.open().then(() => {
      setIsConnected(true)
      console.log('opened')
    })
  }, ['init'])

  return (
    <DbContext.Provider value={db}>
      <HistoryContext.Provider value={history}>
        <StoreContext.Provider value={store}>
          <App isConnected={isConnected} />
        </StoreContext.Provider>
      </HistoryContext.Provider>
    </DbContext.Provider>
  )
}

render(<Client />, rootElement)
