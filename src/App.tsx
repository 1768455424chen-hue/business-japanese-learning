import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import AIAnalyze from './pages/AIAnalyze'
import Notebook from './pages/Notebook'
import Review from './pages/Review'
import Quiz from './pages/Quiz'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="analyze" element={<AIAnalyze />} />
        <Route path="notebook" element={<Notebook />} />
        <Route path="review" element={<Review />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
