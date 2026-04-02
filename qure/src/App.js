import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from './pages/AuthCallback';

function App() {
  return(<BrowserRouter>
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/auth/callback' element={<AuthCallback />} />
    </Routes>
  </BrowserRouter>);
}

export default App;
