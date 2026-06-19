import CreateGamingProfile from "../gaming/create-profile/index";
import gamingHooks from "@/hooks/useGaming";
import authHooks from "@/hooks/useAuth";
import { USER_TYPES } from "@/constants";

const Home = () => {
  const { user, isAuthenticated } = authHooks.useUser();
  const isTeacher = user?.user_type === USER_TYPES.TEACHER;

  const { isLoading, error } = gamingHooks.useGamingProfile({
    enabled: isAuthenticated && !isTeacher,
  });

  if (isLoading) {
    return (
      <div className="mx-auto my-auto flex h-52 items-center justify-center text-5xl font-medium">
        Loading...
      </div>
    );
  }

  const hasNoGamingProfile = error?.response?.status === 404;

  return (
    <>
      {!isTeacher && hasNoGamingProfile && <CreateGamingProfile />}
      <div className="relative overflow-hidden rounded-2xl bg-blue-300 p-8 font-mono shadow-lg">
        <div className="relative z-10 flex flex-col items-center justify-center py-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-wider drop-shadow-md md:text-5xl">
            takerest.online
          </h1>
        </div>
      </div>
    </>
  );
};

export default Home;
