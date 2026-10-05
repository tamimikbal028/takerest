import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import Home from "@/app/home/page";
import Login from "@/app/auth/login/page";
import Register from "@/app/auth/register/page";

// Route configuration
interface RouteConfig {
  path: string;
  Component: LazyExoticComponent<ComponentType> | ComponentType;
  requireAuth: boolean;
  title: string;
  preload?: boolean;
  category?: string;
  display: boolean;
  meta?: {
    description?: string;
    keywords?: string[];
    ogTitle?: string;
  };
}

export const routes: RouteConfig[] = [
  // Public routes
  {
    path: "/login",
    display: true,
    Component: Login,
    requireAuth: false,
    title: "Login - Take Rest",
    category: "auth",
  },
  {
    path: "/register",
    display: true,
    Component: Register,
    requireAuth: false,
    title: "Register - Take Rest",
    category: "auth",
  },

  // Main Home
  {
    path: "/",
    display: true,
    Component: Home,
    requireAuth: false,
    title: "Home - Take Rest",
    preload: true,
    category: "main",
  },

  // Settings
  {
    path: "/settings",
    display: true,
    Component: lazy(() => import("@/app/settings/page")),
    requireAuth: true,
    title: "Settings - Take Rest",
    category: "utility",
  },

  // 404 route
  {
    path: "*",
    display: true,
    Component: lazy(() => import("@/app/shared/NotFound")),
    requireAuth: false,
    title: "Page Not Found",
    category: "error",
  },
];

export const getRouteByPath = (path: string) =>
  routes.find((route) => route.path === path);
