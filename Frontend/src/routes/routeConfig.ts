import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import Home from "@/app/home/page";
import Login from "@/app/auth/login/page";
import Register from "@/app/auth/register/page";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

// Enhanced Route configuration - Industry standard approach
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
    title: "Login",
    category: "auth",
    meta: {
      description: "Login to your account",
      keywords: ["login", "signin"],
    },
  },
  {
    path: "/register",
    display: true,
    Component: Register,
    requireAuth: false,
    title: "Register",
    category: "auth",
    meta: {
      description: "Create a new account",
      keywords: ["register", "signup"],
    },
  },

  // Core app routes
  {
    path: "/",
    display: true,
    Component: Home,
    requireAuth: false,
    title: "Home",
    preload: true,
    category: "main",
    meta: { description: "Your social hub dashboard" },
  },
  {
    path: "/gaming/*",
    display: FEATURE_FLAGS.GAMING,
    Component: lazy(() => import("../app/gaming/page")),
    requireAuth: true,
    title: "Gaming",
    category: "entertainment",
    meta: { description: "Gaming hub and competitions" },
  },

  // Submit Box routes
  {
    path: "/submit-box",
    display: FEATURE_FLAGS.BOX,
    Component: lazy(() => import("../app/submit-box/index")),
    requireAuth: false,
    title: "Submit Box",
    category: "education",
    meta: { description: "Submit files to boxes" },
  },
  {
    path: "/submit-box/create",
    display: FEATURE_FLAGS.BOX,
    Component: lazy(() => import("../app/submit-box/index")),
    requireAuth: true,
    title: "Create Box",
    category: "education",
  },
  {
    path: "/submit-box/submit",
    display: FEATURE_FLAGS.BOX,
    Component: lazy(() => import("../app/submit-box/index")),
    requireAuth: false,
    title: "Submit to Box",
    category: "education",
  },
  {
    path: "/submit-box/:boxId",
    display: FEATURE_FLAGS.BOX,
    Component: lazy(() => import("../app/submit-box/BoxDetails")),
    requireAuth: true,
    title: "Box Details",
    category: "education",
  },

  // Quick Share route
  {
    path: "/quick-share",
    display: FEATURE_FLAGS.QUICK_SHARE,
    Component: lazy(() => import("../app/quick-share/index")),
    requireAuth: false,
    title: "Quick Share",
    category: "education",
    meta: { description: "Quickly share files with others" },
  },

  // Settings routes
  {
    path: "/settings",
    display: FEATURE_FLAGS.SETTINGS,
    Component: lazy(() => import("../app/settings/page")),
    requireAuth: true,
    title: "Settings",
    category: "utility",
    meta: { description: "Account and app settings" },
  },

  // 404 route
  {
    path: "*",
    display: true,
    Component: lazy(() => import("@/app/shared/NotFound")),
    requireAuth: false,
    title: "Page Not Found",
    category: "error",
    meta: { description: "The page you're looking for doesn't exist" },
  },
];

export const getRouteByPath = (path: string) =>
  routes.find((route) => route.path === path);
