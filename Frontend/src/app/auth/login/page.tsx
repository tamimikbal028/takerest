import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { NavLink } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUpload, FaShareAlt } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import authHooks from "@/hooks/useAuth";
import SubmitToBox from "@/app/submit-box/SubmitToBox";

const QuickShareWidget = lazy(() => import("@/app/quick-share"));

// Zod Schema for Login
const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// TypeScript type infer from Zod schema
type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { mutate: login, isPending } = authHooks.useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [activeView, setActiveView] = useState<"login" | "box" | "quick-share">(
    "login"
  );
  // Ref for focusing password field
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const emailRegister = register("email");
  const passwordRegister = register("password");
  const rememberMeRegister = register("rememberMe");

  // Loading remembered email from localStorage on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      reset({
        email: rememberedEmail,
        password: "qqqqqqQ1",
        rememberMe: true,
      });
      // If email already exists, focus directly on Password field
      setTimeout(() => passwordRef.current?.focus(), 0);
    }
  }, [reset]);

  // Form submit handler
  const onSubmit = (loginData: LoginFormData) => {
    // Remember Me: handle before login
    if (loginData.rememberMe) {
      localStorage.setItem("rememberedEmail", loginData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    login({
      email: loginData.email,
      password: loginData.password,
    });
  };

  return (
    <div className="mx-3 flex w-full flex-col items-center justify-center gap-8 py-10 lg:mx-0 lg:flex-row lg:gap-16">
      {/* Header - Left Side */}
      <div className="text-center lg:text-left">
        <h1 className="mb-2 text-4xl font-bold text-blue-600 lg:text-5xl">
          Take Rest
        </h1>
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 lg:text-3xl">
          Welcome Back
        </h2>
        <p className="text-sm text-gray-600 sm:text-base">
          Sign in to your account to continue
        </p>
      </div>

      {/* Right Side - Forms and Toggle */}
      <div
        className={`flex w-full flex-col gap-4 transition-all duration-300 ${activeView === "login" ? "max-w-[400px] lg:max-w-[420px]" : "max-w-xl"}`}
      >
        {/* Form Container */}
        {activeView === "login" && (
          <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoFocus // focus by default when new window loads
                    name={emailRegister.name}
                    onChange={emailRegister.onChange}
                    onBlur={emailRegister.onBlur}
                    ref={emailRegister.ref}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:ring-2 focus:outline-none ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name={passwordRegister.name}
                      onChange={passwordRegister.onChange}
                      onBlur={passwordRegister.onBlur}
                      // Connecting Ref with Hook Form
                      ref={(e) => {
                        passwordRegister.ref(e);
                        passwordRef.current = e;
                      }}
                      className={`w-full rounded-lg border px-3 py-2 pr-10 transition-colors focus:ring-2 focus:outline-none ${
                        errors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    name={rememberMeRegister.name}
                    onChange={rememberMeRegister.onChange}
                    onBlur={rememberMeRegister.onBlur}
                    ref={rememberMeRegister.ref}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <NavLink
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </NavLink>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Register NavLink */}
            <div className="mt-5 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <NavLink
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up here
                </NavLink>
              </p>
            </div>
          </div>
        )}

        {activeView === "box" && (
          <div className="w-full">
            <SubmitToBox />
          </div>
        )}

        {activeView === "quick-share" && (
          <Suspense
            fallback={
              <div className="py-4 text-center text-sm text-gray-500">
                Loading...
              </div>
            }
          >
            <div className="animate-fade-in w-full">
              <QuickShareWidget />
            </div>
          </Suspense>
        )}

        {activeView === "login" ? (
          <div className="flex gap-2.5">
            <button
              onClick={() => setActiveView("box")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
            >
              <FaUpload className="h-4 w-4" />
              Submit File to Box
            </button>
            <button
              onClick={() => setActiveView("quick-share")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
            >
              <FaShareAlt className="h-4 w-4" />
              Quick File Share
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveView("login")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
