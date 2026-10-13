import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { RouteError } from "@/shared/components/RouteError";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import CartPage from "@/pages/CartPage";
import CustomOrderPage from "@/pages/CustomOrderPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminStockPage = lazy(() => import("@/pages/admin/AdminStockPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminCustomersPage = lazy(() => import("@/pages/admin/AdminCustomersPage"));
const AdminRequestsPage = lazy(() => import("@/pages/admin/AdminRequestsPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
export const router = createBrowserRouter([{
  path: "/",
  Component: MainLayout,
  errorElement: <RouteError />,
  children: [{
    index: true,
    Component: HomePage
  }, {
    path: "shop",
    Component: ShopPage
  }, {
    path: "cart",
    Component: CartPage
  }, {
    path: "request",
    Component: CustomOrderPage
  }, {
    path: "orders",
    Component: MyOrdersPage
  }, {
    path: "profile",
    Component: ProfilePage
  }]
}, {
  path: "/admin",
  Component: AdminLayout,
  errorElement: <RouteError />,
  children: [{
    index: true,
    Component: AdminDashboardPage
  }, {
    path: "dashboard",
    Component: AdminDashboardPage
  }, {
    path: "stock",
    Component: AdminStockPage
  }, {
    path: "orders",
    Component: AdminOrdersPage
  }, {
    path: "customers",
    Component: AdminCustomersPage
  }, {
    path: "requests",
    Component: AdminRequestsPage
  }, {
    path: "settings",
    Component: AdminSettingsPage
  }]
}, {
  Component: AuthLayout,
  errorElement: <RouteError />,
  children: [{ path: "/login", Component: LoginPage }, { path: "/signup", Component: SignupPage }]
}]);
