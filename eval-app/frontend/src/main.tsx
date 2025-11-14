import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './App.tsx'
import { crlTheme } from './theme'
import 'antd/dist/reset.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={crlTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
