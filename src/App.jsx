import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MyThree from './Three'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
<MyThree/>
    </>
  )
}

export default App
