import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <h1>Mail Sender</h1>
      <p>React app template — edit <code>src/App.jsx</code> to get started.</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

export default App
