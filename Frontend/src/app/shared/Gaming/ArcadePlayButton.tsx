import Swal from "sweetalert2";
import gamingHooks from "@/hooks/useGaming";

interface ArcadePlayButtonProps {
  onAction: () => void;
  isLoading: boolean;
  label: string;
}

const TOKEN_COST = 1;

const ArcadePlayButton = ({
  onAction,
  isLoading,
  label,
}: ArcadePlayButtonProps) => {
  const { data: profileData } = gamingHooks.useGamingProfile();
  const tokens = profileData?.profile?.tokens ?? 0;

  const handleClick = async () => {
    // 1. Check tokens
    if (tokens < TOKEN_COST) {
      await Swal.fire({
        title: "Out of Tokens!",
        text: "You don't have enough Tokens to start this game. Purchase more to continue.",
        icon: "error",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Got it",
        customClass: {
          popup: "rounded-2xl font-sans",
        },
      });
      return;
    }

    // 2. Confirm play
    const result = await Swal.fire({
      title: "Start Game?",
      text: `Playing this game will cost ${TOKEN_COST} Token.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb", // Blue-600 to match our button
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Start Game",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl font-sans",
      },
    });

    if (result.isConfirmed) {
      onAction();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="group rounded-2xl bg-blue-600 px-12 py-5 text-sm font-black tracking-[0.2em] text-white shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
    >
      {isLoading ? "PREPARING..." : label}
    </button>
  );
};

export default ArcadePlayButton;

