import {set} from 'segmented-property'
import {parse} from '../parse'
import {evalQuery} from '../eval'
import {createId} from './utils'

export function create (schema) {
  let isSupported = true
  let db

  const open = () =>
    db
      ? Promise.resolve(db)
      : new Promise((resolve, reject) => {
        isSupported = Boolean(window.indexedDB)

        if (!isSupported) {
          console.warn('the browser does not support IndexedDB')
          return resolve()
        }

        const openReq = window.indexedDB.open('test_db', 1)

        openReq.onupgradeneeded = function (e) {
          db = e.target.result
          if (!db.objectStoreNames.contains('records')) {
            const recordsObjectStore = db.createObjectStore('records', {
              keyPath: '_id'
            })
            recordsObjectStore.createIndex('_id', '_id', {unique: true})
          }
        }

        openReq.onerror = event => {
          console.error(openReq, event)
          reject(new Error('IndexedDB error'))
        }

        openReq.onsuccess = event => {
          db = event.target.result
          resolve()
        }
      })

  const addRecord = record =>
    new Promise((resolve, reject) => {
      const recordsTransaction = db.transaction(['records'], 'readwrite')
      const recordsStore = recordsTransaction.objectStore('records', {
        keyPath: '_id'
      })

      if (!record._id) {
        record._id = createId()
      }

      const addReq = recordsStore.add(record)

      addReq.onerror = e => {
        reject(new Error(`could not add record: ${e.target.error.message}`))
      }

      addReq.onsuccess = () => {
        resolve()
      }
    })

  const setInRecord = (filter, key, value) =>
    new Promise((resolve, reject) => {
      console.log('setInRecord', filter, key, value)

      getRecordById(filter._id)
        .then(record => {
          record = set(record, key, value)

          const recordsTransaction = db.transaction(['records'], 'readwrite')
          const recordsStore = recordsTransaction.objectStore('records', {
            keyPath: '_id'
          })

          const putReq = recordsStore.put(record)

          putReq.onerror = e => {
            reject(new Error(`could not put record: ${e.target.error.message}`))
          }

          putReq.onsuccess = () => {
            resolve()
          }
        })
        .catch(reject)
    })

  const transaction = mutations => {
    return Promise.all(
      mutations.map(mutation => {
        if (mutation.type === 'create') return addRecord(mutation.record)
        if (mutation.type === 'set') {
          return setInRecord(mutation.filter, mutation.key, mutation.value)
        }
        return Promise.reject(
          new Error(`unknown mutation type: ${mutation.type}`)
        )
      })
    )
  }

  const actions = {
    create: record => ({type: 'create', record}),
    set: (filter, key, value) => ({type: 'set', filter, key, value})
  }

  const getAllRecords = () =>
    new Promise((resolve, reject) => {
      const transaction = db.transaction(['records'], 'readonly')
      const store = transaction.objectStore('records')
      const req = store.getAll()
      req.onerror = event => {
        console.log(event)
        reject(new Error('could not get all'))
      }
      req.onsuccess = () => {
        resolve(req.result)
      }
    })

  const getRecordById = id => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['records'], 'readonly')
      const store = transaction.objectStore('records')
      const getReq = store.get(id)

      getReq.onsuccess = event => {
        resolve(getReq.result)
      }

      getReq.onerror = event => {
        console.error(event)
        resolve(new Error('failed to get record'))
      }
    })
  }

  const query = async q => {
    console.log('>', q)
    const scope = await getAllRecords()
    const query = parse(schema, q)

    return evalQuery(schema, scope, query).data
  }

  return {schema, open, addRecord, transaction, actions, query}
}
