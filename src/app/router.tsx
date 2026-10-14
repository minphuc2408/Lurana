import { createBrowserRouter } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { RouteError } from '@/shared/components/RouteError';
import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import CartPage from '@/pages/CartPage';
import UnavailablePage from '@/pages/UnavailablePage';
// Preserve feature source and its temp backup; routes without server APIs stay hidden.
export const router = createBrowserRouter([{
  path: '/', Component: MainLayout, errorElement: <RouteError />,
  children: [
    { index: true, Component: HomePage }, { path: 'shop', Component: ShopPage }, { path: 'cart', Component: CartPage },
    ...['request', 'orders', 'profile', 'login', 'signup', 'admin/*'].map(path => ({ path, Component: UnavailablePage })),
    { path: '*', Component: UnavailablePage },
  ],
}]);
