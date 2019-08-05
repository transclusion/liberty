import React, {useContext, useEffect, useState} from 'react'
import JSONTree from 'react-json-tree'
import {DbContext} from '../../contexts'
import {CodeEditor} from '../components/codeEditor'
import {Nav} from '../containers/nav'

export function DataExplorerScreen () {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [queryError, setQueryError] = useState(null)
  const db = useContext(DbContext)

  const runQuery = q =>
    db
      .query(q)
      .then(result => {
        setQueryError(null)
        setResult(result)
      })
      .catch(err => setQueryError(err.message))

  const handleQueryChange = q => {
    window.localStorage.setItem('liberty:query', q)
    setQuery(q)
    runQuery(q)
  }

  useEffect(() => {
    const q = window.localStorage.getItem('liberty:query')
    if (q) {
      setQuery(q)
      runQuery(q)
    }
  }, ['/*'])

  return (
    <>
      <Nav />
      <div style={{display: 'flex', height: 'calc(100vh - 56px)'}}>
        <CodeEditor
          onChange={handleQueryChange}
          style={{flex: 1}}
          value={query}
        />
        <div style={{flex: 1, display: 'flex', overflow: 'auto'}}>
          {queryError && <div>{queryError}</div>}
          {!queryError && result && (
            <JSONTree
              data={result}
              theme={{
                tree: ({style}) => ({
                  style: {
                    ...style,
                    margin: 0,
                    padding: '1rem',
                    flex: 1,
                    fontFamily: 'SF Mono',
                    fontSize: '0.875rem'
                  }
                })
              }}
            />
          )}
        </div>
      </div>
    </>
  )
}
