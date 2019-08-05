import React, {useContext, useEffect, useState} from 'react'
import {set} from 'segmented-property'
import styled from 'styled-components'
import {Form} from '../../components/form'
import {Link} from '../../containers/link'
import {Nav} from '../../containers/nav'
import {DbContext, HistoryContext} from '../../'
import {createId} from '../../../lib/db/utils'

const PaneContainer = styled.div`
  display: flex;
  height: calc(100% - 56px);

  & > * {
    flex: 1;
  }

  & > * + * {
    margin-left: 1px;
  }
`

const PaneHeader = styled.header`
  padding: 1rem;
  font-weight: 700;
  font-size: 20px;
`

const DefaultPane = styled.div`
  background: #fff;
  color: #000;
  overflow: auto;
  max-width: 300px;

  &:last-child {
    max-width: none;
  }
`

const ErrorPane = styled.div`
  background: #fdd;
  color: #f00;
  padding: 1rem;
`

// const LoadingPane = styled.div`
//   background: #fff;
//   color: #000;
//   display: flex;
//   justify-content: center;
//   align-items: center;
// `

const PreviewLink = styled(Link)`
  display: block;
  padding: 1rem;
  color: inherit;
  text-decoration: none;

  &:hover {
    background: #eee;
  }
`

function parsePath (path) {
  const parts = path.split('/').filter(Boolean)
  const segments = []
  let lastPart
  let i = 0
  for (const part of parts) {
    if (part === '+') {
      segments.push({
        type: 'editor',
        key: 'editor',
        typeKey: lastPart,
        id: null
      })
    } else if (i === 0) {
      segments.push({type: 'documentList', key: part, typeKey: part})
    } else {
      segments.push({type: 'editor', key: part, typeKey: lastPart, id: part})
    }
    lastPart = part
    i += 1
  }
  return [{type: 'root', key: '_root'}].concat(segments)
}

function RootPane () {
  const {schema} = useContext(DbContext)
  const documentTypes = schema.types.filter(t => t.type === 'document')

  return (
    <DefaultPane>
      <PaneHeader>Content</PaneHeader>
      {documentTypes.map(t => (
        <PreviewLink key={t.key} path={`/desk/${t.key}`}>
          {t.title}
        </PreviewLink>
      ))}
    </DefaultPane>
  )
}

function DocumentDefaultPane (props) {
  const [items, setItems] = useState(null)
  const db = useContext(DbContext)
  const typeKey = props.typeKey
  const documentType = db.schema.types.find(
    t => t.type === 'document' && t.key === typeKey
  )

  if (!documentType) {
    return <ErrorPane>Unknown document type: {props.name}</ErrorPane>
  }

  useEffect(() => {
    db.query(`[${props.typeKey}]`).then(setItems)
  }, [props.name])

  return (
    <DefaultPane>
      <PaneHeader>
        {documentType.title}
        <Link path={`/desk/${typeKey}/+`}>+</Link>
      </PaneHeader>
      {items &&
        items.map(item => (
          <PreviewLink key={item._id} path={`/desk/${typeKey}/${item._id}`}>
            {item.title || item.name}
          </PreviewLink>
        ))}
    </DefaultPane>
  )
}

function EditorPane (props) {
  const db = useContext(DbContext)
  const {replaceState} = useContext(HistoryContext)
  const [data, setData] = useState(null)
  const typeKey = props.typeKey
  const documentType = db.schema.types.find(
    t => t.type === 'document' && t.key === typeKey
  )

  if (!documentType) {
    return <ErrorPane>Type not found: {typeKey}</ErrorPane>
  }

  useEffect(() => {
    if (props.id) {
      db.query(`[_id=="${props.id}"]`).then(result => {
        setData(result[0])
      })
    }
  }, [typeKey])

  const handleFieldChange = (field, value) => {
    const exists = Boolean(props.id || (data && data._id))
    const id = props.id || (data && data._id) || createId()

    if (exists) {
      const newData = set(data, field.key, value)
      setData(newData)

      db.transaction([db.actions.set({_id: id}, field.key, value)]).then(() => {
        console.log('successful update')
      })
    } else {
      const newData = set({_id: id, _type: typeKey}, field.key, value)
      setData(newData)

      db.transaction([db.actions.create(newData)]).then(() => {
        console.log('successful create')
      })

      replaceState({path: `/desk/${typeKey}/${id}`})
    }
  }

  return (
    <DefaultPane>
      <PaneHeader>
        {data ? (
          <>{data.title || data.name || <em>Untitled</em>}</>
        ) : (
          <>New {props.typeKey}</>
        )}
      </PaneHeader>
      {
        <Form
          data={data || {}}
          fields={documentType.fields}
          onFieldChange={handleFieldChange}
        />
      }
    </DefaultPane>
  )
}

export function DeskScreen (props) {
  const segments = parsePath(props.path)
  return (
    <>
      <Nav />
      <PaneContainer>
        {segments.map(segment => {
          if (segment.type === 'editor') return <EditorPane {...segment} />
          if (segment.type === 'root') return <RootPane {...segment} />
          if (segment.type === 'documentList') {
            return <DocumentDefaultPane {...segment} />
          }
          return (
            <ErrorPane key={segment.key}>
              Unknown pane type: {segment.type}
            </ErrorPane>
          )
        })}
      </PaneContainer>
    </>
  )
}
