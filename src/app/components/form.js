import React from 'react'
import styled from 'styled-components'

const FieldRoot = styled.div`
  padding: 1rem;
`

const StringInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem;
  font: inherit;
`

const NumberInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem;
  font: inherit;
`

function Field (props) {
  const {data, field, onChange} = props

  if (field.type === 'string') {
    return (
      <FieldRoot>
        <div>
          <label>{field.title}</label>
        </div>
        <div>
          <StringInput
            type='text'
            onChange={evt => onChange(field, evt.target.value)}
            value={data || ''}
          />
        </div>
      </FieldRoot>
    )
  }

  if (field.type === 'number') {
    return (
      <FieldRoot>
        <div>
          <label>{field.title}</label>
        </div>
        <div>
          <NumberInput
            type='text'
            onChange={evt => onChange(field, Number(evt.target.value))}
            value={data || ''}
          />
        </div>
      </FieldRoot>
    )
  }

  return <div>unknown field type: {field.type}</div>
}

export function Form (props) {
  const {data, fields, onFieldChange} = props

  return (
    <div>
      {fields.map(field => (
        <Field
          key={field.key}
          data={data[field.key]}
          field={field}
          onChange={onFieldChange}
        />
      ))}
    </div>
  )
}
