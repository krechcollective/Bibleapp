import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ReaderView } from './views/ReaderView'
import { PlanView } from './views/PlanView'
import { SettingsView } from './views/SettingsView'
import { WorkoutsView } from './views/WorkoutsView'
import { WorkoutPlayerView } from './views/WorkoutPlayerView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ReaderView />} />
          <Route path="plan" element={<PlanView />} />
          <Route path="workouts" element={<WorkoutsView />} />
          <Route path="workouts/:id/run" element={<WorkoutPlayerView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
