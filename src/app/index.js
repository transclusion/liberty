import React, {useContext, useEffect, useState} from 'react'
import {DataExplorerScreen} from './screens/dataExplorer'
import {DeskScreen} from './screens/desk'
import {HomeScreen} from './screens/home'

export const DbContext = React.createContext(null)
export const HistoryContext = React.createContext(null)
export const StoreContext = React.createContext(null)

function matchRoute (loc) {
  if (loc.path === '/') return {name: 'home', params: loc.query}
  if (loc.path === '/data') return {name: 'data', params: loc.query}
  if (loc.path.startsWith('/desk')) {
    return {name: 'desk', params: {...loc.query, path: loc.path.slice(6)}}
  }
  return {name: 'notFound', params: {}}
}

export function App (props) {
  const history = useContext(HistoryContext)
  const [loc, setLoc] = useState(history.current)
  const route = matchRoute(loc)

  // initialize
  useEffect(() => history.subscribe(setLoc), ['init'])

  // render while connecting...
  if (!props.isConnected) return <div>Connecting...</div>

  // render screen
  if (route.name === 'home') return <HomeScreen {...route.params} />
  if (route.name === 'data') return <DataExplorerScreen {...route.params} />
  if (route.name === 'desk') return <DeskScreen {...route.params} />
  return <div>Not found: {loc.path}</div>
}
