import React from 'react'
import ReactDOM from 'react-dom/client'
import DrawingApp from './Drawing' // Import the component
import './canvas.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DrawingApp />
  </React.StrictMode>,
)

