import { useState } from "react";
import { FaArrowRight, FaTrophy } from "react-icons/fa";
import gamingHooks from "@/hooks/useGaming";

const CreateGamingProfile = () => {
  const [gamerName, setGamerName] = useState("");
  const [errorLocal, setErrorLocal] = useState("");

  const createProfileMutation = gamingHooks.useCreateGamingProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamerName.trim()) {
      setErrorLocal("Please enter a valid Nickname");
      return;
    }
    if (gamerName.length < 3) {
      setErrorLocal("Nickname must be at least 3 characters");
      return;
    }
    if (gamerName.length > 15) {
      setErrorLocal("Nickname cannot exceed 15 characters");
      return;
    }

    createProfileMutation.mutate(gamerName.trim());
  };

  const isSubmitting = createProfileMutation.isPending;

  return (
    <div className="flex items-center justify-center">
      <div className="animate-in zoom-in-95 relative w-full max-w-md duration-500">
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FaTrophy className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Join the Competition
            </h2>
            <p className="mt-2 text-sm font-medium text-gray-500">
              Create your unique gaming identity to compete in tournaments.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="gamerName"
                className="mb-2 block text-sm font-bold tracking-wide text-gray-700"
              >
                Enter Your Nickname
              </label>
              <div className="relative">
                <input
                  id="gamerName"
                  type="text"
                  value={gamerName}
                  disabled={isSubmitting}
                  autoFocus
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 15) {
                      setGamerName(val);
                      if (errorLocal) setErrorLocal("");
                    }
                  }}
                  className={`block w-full rounded-xl border-2 bg-gray-50 px-4 py-3.5 font-medium text-gray-900 transition-all focus:ring-0 focus:outline-none ${
                    errorLocal
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500 focus:bg-white"
                  }`}
                  placeholder="e.g. ShadowSniper"
                  maxLength={15}
                />
              </div>
              {errorLocal && (
                <p className="animate-in slide-in-from-top-1 mt-2 text-sm font-medium text-red-600">
                  {errorLocal}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Joining..." : "Enter Arena"}
              {!isSubmitting && (
                <FaArrowRight className="transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGamingProfile;
