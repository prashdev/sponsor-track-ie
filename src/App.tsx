import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './routes/Dashboard';
import Jobs from './routes/Jobs';
import Contacts from './routes/Contacts';
import Sponsors from './routes/Sponsors';
import InterviewPrep from './routes/InterviewPrep';
import JdAnalyzer from './routes/JdAnalyzer';
import RetailSponsors from './routes/RetailSponsors';
import Recruiters from './routes/Recruiters';
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
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/interview" element={<InterviewPrep />} />
          <Route path="/study" element={<Study />} />
          <Route path="/news" element={<News />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/jd-analyzer" element={<JdAnalyzer />} />
          <Route path="/fallback-roles" element={<RetailSponsors />} />
          <Route path="/recruiters" element={<Recruiters />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
