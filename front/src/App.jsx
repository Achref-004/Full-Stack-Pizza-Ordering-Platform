import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import MyCustomPizzas from './pages/MyCustomPizzas';
import OrderConfirmation from './pages/OrderConfirmation'; 
import Orders from './pages/Orders';
import AdminPizzas from './pages/AdminPizzas';
import AdminOrders from './pages/AdminOrders';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <Navigate to={
              isAuthenticated 
                ? (user?.isAdmin ? "/admin" : "/home") 
                : "/login"
            } />} 
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/home" 
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin" 
          element={isAuthenticated && user?.isAdmin ? <Admin /> : <Navigate to="/home" />} 
        />
        {/* CHANGEZ ICI : Utilisez des minuscules pour la cohérence */}
        <Route 
          path="/admin/pizzas"  // Changé de /AdminPizzas à /admin/pizzas
          element={isAuthenticated && user?.isAdmin ? <AdminPizzas /> : <Navigate to="/home" />} 
        />
        {/* CHANGEZ ICI : Utilisez des minuscules pour la cohérence */}
        <Route 
          path="/admin/orders"  // Changé de /AdminOrders à /admin/orders
          element={isAuthenticated && user?.isAdmin ? <AdminOrders /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/cart" 
          element={isAuthenticated ? <Cart /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/my-custom-pizzas" 
          element={isAuthenticated ? <MyCustomPizzas /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/confirmation"
          element={isAuthenticated ? <OrderConfirmation /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/orders" 
          element={isAuthenticated ? <Orders /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;