import React from 'react'
import styled from 'styled-components'
import {Link} from './link'

const Root = styled.nav`
  display: flex;
`

const StyledLink = styled(Link)`
  display: block;
  padding: 1rem;
  color: inherit;
  text-decoration: none;
`

export function Nav () {
  return (
    <Root>
      <div>
        <StyledLink path='/'>Liberty</StyledLink>
      </div>
      <div style={{display: 'flex'}}>
        <StyledLink path='/desk'>Desk</StyledLink>
        <StyledLink path='/data'>Data explorer</StyledLink>
      </div>
    </Root>
  )
}
