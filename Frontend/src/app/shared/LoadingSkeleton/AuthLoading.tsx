const AuthLoading = () => {
  const text = "Checking Authentication...";

  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-center bg-slate-50 text-center font-sans">
      <div className="relative flex flex-wrap justify-center gap-x-1 gap-y-2 px-6 sm:gap-x-2">
        {text.split("").map((char, index) => (
          <span
            key={index}
            className="inline-block text-2xl font-extrabold tracking-tight text-slate-300 transition-opacity duration-500 sm:text-3xl md:text-5xl"
            style={{
              animation: "smoothPulse 2s infinite ease-in-out",
              animationDelay: `${index * 0.05}s`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>

      {/* Screen-wide slim loading bar indicator */}
      <div className="mt-5 h-0.5 w-full overflow-hidden bg-slate-100">
        <div
          className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          style={{
            width: "30%",
            animation: "slideProgress 1.5s infinite ease-in-out",
          }}
        />
      </div>

      <style>{`
        @keyframes smoothPulse {
          0%, 100% {
            color: #cbd5e1; /* slate-300 */
          }
          50% {
            color: #2563eb; /* blue-600 */
          }
        }
        @keyframes slideProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default AuthLoading;

