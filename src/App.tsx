import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './routes/Dashboard';
import Jobs from './routes/Jobs';
import Sponsors from './routes/Sponsors';
import Study from './routes/Study';
import News from './routes/News';
import Blog from './routes/Blog';
import Settings from './routes/Settings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/study" element={<Study />} />
          <Route path="/news" element={<News />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
