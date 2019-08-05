export function createHistory () {
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
