import React, {useContext} from 'react'
import {HistoryContext} from '../'

export function Link ({children, path, ...props}) {
  const {pushState} = useContext(HistoryContext)
  const url = path

  const handleClick = evt => {
    evt.preventDefault()
    pushState({path})
  }

  return (
    <a {...props} href={url} onClick={handleClick}>
      {children}
    </a>
  )
}
