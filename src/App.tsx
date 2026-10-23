import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ProductForm from './pages/admin/ProductForm'
import AnalyticsPage from './pages/admin/Analytics'
import OrdersPage from './pages/admin/Orders'
import Account from './pages/admin/Account'
import Login from './pages/admin/Login'
import ShopLayout from './pages/shop/ShopLayout'
import ShopHome from './pages/shop/ShopHome'
import ShopProduct from './pages/shop/ShopProduct'
import ShopTrack from './pages/shop/ShopTrack'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop" replace />} />
      <Route path="/shop" element={<ShopLayout />}>
        <Route index element={<ShopHome />} />
        <Route path="product/:id" element={<ShopProduct />} />
        <Route path="track" element={<ShopTrack />} />
      </Route>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="account" element={<Account />} />
        <Route path="settings" element={<Navigate to="/admin/account" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  )
}
