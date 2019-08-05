import React, {useEffect, useRef, useState} from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js'

// window.MonacoEnvironment = {
//   getWorkerUrl: function (moduleId, label) {
//     if (label === 'json') {
//       return './json.worker.js'
//     }
//     if (label === 'css') {
//       return './css.worker.js'
//     }
//     if (label === 'html') {
//       return './html.worker.js'
//     }
//     if (label === 'typescript' || label === 'javascript') {
//       return './ts.worker.js'
//     }
//     return './editor.worker.js'
//   }
// }

export function CodeEditor (props) {
  const container = useRef()
  const [editor, setEditor] = useState(null)
  const [currValue, setCurrValue] = useState(props.value)

  // initialize editor
  useEffect(() => {
    if (!container.current) return
    const e = monaco.editor.create(container.current, {
      value: props.value,
      language: 'liberty',
      minimap: {enabled: false},
      theme: 'monaco'
    })
    e.getModel().onDidChangeContent(event => {
      const newValue = e.getValue()
      setCurrValue(newValue)
      if (props.onChange) props.onChange(newValue)
    })
    setEditor(e)
  }, 'init')

  // change value from outside
  useEffect(() => {
    if (props.value !== currValue) {
      editor.setValue(props.value)
    }
  }, [props.value])

  return <div ref={container} style={props.style} />
}
