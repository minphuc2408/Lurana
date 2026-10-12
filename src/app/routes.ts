import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Landing } from "./pages/Landing";
import { Shop } from "./pages/Shop";
import { Cart } from "./pages/Cart";
import { Request } from "./pages/Request";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Profile } from "./pages/Profile";
import { Stock } from "./pages/Stock";
import { Dashboard } from "./pages/Dashboard";
import { OrderHistory } from "./pages/OrderHistory";
import { AdminOrders } from "./pages/AdminOrders";
import { AdminCustomers } from "./pages/AdminCustomers";
import { AdminRequests } from "./pages/AdminRequests";
import { AdminSettings } from "./pages/AdminSettings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Landing },
      { path: "shop", Component: Shop },
      { path: "cart", Component: Cart },
      { path: "request", Component: Request },
      { path: "profile", Component: Profile },
      { path: "orders", Component: OrderHistory },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "dashboard", Component: Dashboard },
      { path: "stock", Component: Stock },
      { path: "orders", Component: AdminOrders },
      { path: "customers", Component: AdminCustomers },
      { path: "requests", Component: AdminRequests },
      { path: "settings", Component: AdminSettings },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
]);
