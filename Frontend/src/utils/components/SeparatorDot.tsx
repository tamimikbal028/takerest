interface SeparatorDotProps {
  h?: string; // Tailwind height class, e.g. 'h-1'
  w?: string; // Tailwind width class, e.g. 'w-1'
  color?: string; // Tailwind bg color class, e.g. 'bg-gray-400'
  className?: string;
  ariaHidden?: boolean;
}

const SeparatorDot = ({
  h = "h-1",
  w = "w-1",
  color = "bg-gray-400",
  className = "",
  ariaHidden = true,
}: SeparatorDotProps) => {
  return (
    <span
      className={`${h} ${w} rounded-full ${color} ${className}`.trim()}
      aria-hidden={ariaHidden}
    />
  );
};

export default SeparatorDot;

