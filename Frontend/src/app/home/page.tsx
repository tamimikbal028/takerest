import authHooks from "@/hooks/useAuth";

const Home = () => {
  const { user, isAuthenticated } = authHooks.useUser();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl">
        <span className="text-2xl font-black">TR</span>
      </div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Take Rest
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        {isAuthenticated
          ? `Welcome, ${user?.full_name}! Ready to set up your tracker system.`
          : "Clean workspace ready. Log in or configure your new features."}
      </p>
    </div>
  );
};

export default Home;
