interface KeepTypingProps {
  minChars?: number;
}

const KeepTyping = ({ minChars = 2 }: KeepTypingProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-blue-500 bg-white p-5 text-center shadow-sm">
      <p className="text-sm font-medium text-gray-600">
        Please type at least {minChars} characters to search
      </p>
    </div>
  );
};

export default KeepTyping;
