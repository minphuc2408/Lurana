import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { MetadataLayout } from './layouts/MetadataLayout';
import { AdminRoute } from '@/features/auth';
import { RouteError } from '@/shared/components/RouteError';
import HomePage from '@/pages/HomePage';
import StoryPage from '@/pages/StoryPage';
import ShopPage from '@/pages/ShopPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import { CheckoutLayout } from './layouts/CheckoutLayout';
import TrackOrderPage from '@/pages/TrackOrderPage';
import LoginPage from '@/pages/LoginPage';
import UnavailablePage from '@/pages/UnavailablePage';
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminStockPage = lazy(() => import('@/pages/admin/AdminStockPage'));
const AdminDeliveryZonesPage = lazy(() => import('@/pages/admin/AdminDeliveryZonesPage'));
// Deferred features keep their source while routes without real APIs stay hidden.
export const router = createBrowserRouter([{ Component: MetadataLayout, children: [{
  path: '/', Component: MainLayout, errorElement: <RouteError />,
  children: [
    { index: true, Component: HomePage }, { path: 'shop', Component: ShopPage }, { Component: CheckoutLayout, children: [{ path: 'cart', Component: CartPage }, { path: 'checkout', Component: CheckoutPage }] },
    { path: 'shop/:slug', Component: ProductDetailPage },
    { path: 'about', Component: StoryPage },
    { path: 'orders/track', Component: TrackOrderPage },
    ...['request', 'orders', 'profile', 'login', 'signup'].map(path => ({ path, Component: UnavailablePage })),
    { path: '*', Component: UnavailablePage },
  ],
}, { Component: AuthLayout, errorElement: <RouteError />, children: [{ path: '/admin/login', Component: LoginPage }] }, {
  path: '/admin', element: <AdminRoute><AdminLayout /></AdminRoute>, errorElement: <RouteError />,
  children: [
    { index: true, element: <Navigate to="/admin/dashboard" replace /> },
    { path: 'dashboard', Component: AdminDashboardPage },
    { path: 'orders', Component: AdminOrdersPage },
    { path: 'stock', Component: AdminStockPage },
    { path: 'products', element: <Navigate to="/admin/stock" replace /> },
    { path: 'delivery-zones', Component: AdminDeliveryZonesPage },
    { path: '*', Component: UnavailablePage },
  ],
}] }], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' });
