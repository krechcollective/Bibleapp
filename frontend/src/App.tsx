import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ReaderView } from './views/ReaderView'
import { PlanView } from './views/PlanView'
import { SettingsView } from './views/SettingsView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ReaderView />} />
          <Route path="plan" element={<PlanView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
