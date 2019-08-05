import React, {useEffect, useState} from 'react'
import {render} from 'react-dom'
import {App, DbContext, HistoryContext, StoreContext} from './app'
import {createDb} from './lib/db/browser'
import {createHistory} from './lib/history/browser'
import {createStore} from './lib/store'
import schema from './schema'

const store = createStore(schema)
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
