import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Transactions from './pages/Transactions';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Accounts from './pages/Accounts';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
