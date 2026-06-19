import { FaLink } from "react-icons/fa";
import { toast } from "sonner";

interface CopyLinkButtonProps {
  displayText?: string;
  copyValue?: string;
  icon?: React.ReactNode;
  onSuccess?: () => void;
  className?: string;
}

const CopyLinkButton = ({
  displayText = "Copy address link",
  copyValue,
  icon,
  onSuccess,
  className = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50",
}: CopyLinkButtonProps) => {
  const handleCopyLink = async () => {
    try {
      const valueToCopy = copyValue || window.location.href;
      await navigator.clipboard.writeText(valueToCopy);
      toast.success("Link copied to clipboard");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to copy link: ", err);
      toast.error("Failed to copy link");
    }
  };

  return (
    <button onClick={handleCopyLink} className={className}>
      {icon || <FaLink className="h-4 w-4 shrink-0" />}
      <span className="font-medium">{displayText}</span>
    </button>
  );
};

export default CopyLinkButton;
