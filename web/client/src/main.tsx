import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { AppToaster } from '@/components/ui/app-toaster'
import App from './App'
import './index.css'

document.addEventListener('contextmenu', event => {
  event.preventDefault()
})

document.addEventListener('copy', event => {
  event.preventDefault()
})

document.addEventListener('cut', event => {
  event.preventDefault()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <App />
      <AppToaster />
    </ThemeProvider>
  </React.StrictMode>,
)
