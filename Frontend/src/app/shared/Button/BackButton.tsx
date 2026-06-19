import { FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  className?: string;
}

const BackButton = ({
  className = "absolute top-4 left-4",
}: BackButtonProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/50 ${className}`}
    >
      <FaArrowLeft className="h-5 w-5" />
    </button>
  );
};

export default BackButton;

