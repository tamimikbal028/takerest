import { RiErrorWarningLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

interface NotFoundErrorProps {
  title: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const NotFoundError = ({
  title,
  message,
  buttonText = "Home Page",
  onButtonClick,
}: NotFoundErrorProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 rounded-full bg-red-50 p-6 text-red-500">
        <RiErrorWarningLine className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-500">{message}</p>

      <button
        onClick={handleClick}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default NotFoundError;

