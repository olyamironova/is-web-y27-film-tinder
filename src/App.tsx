import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MovieDetail } from './pages/MovieDetail';
import { Account } from './pages/Account';
import { Recommendations } from './pages/Recommendations';
import { Auth } from './pages/Auth';
import { SessionProvider } from './components/SessionProvider';

function App() {
  return (
    <SessionProvider>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/account" element={<Account />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </SessionProvider>
  );
}

export default App;
