const PageLoader = ({ label = "Loading..." }: { label?: string }) => {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
      <p className="animate-pulse text-sm font-bold tracking-widest text-blue-600 uppercase">
        {label}
      </p>
    </div>
  );
};

export default PageLoader;
