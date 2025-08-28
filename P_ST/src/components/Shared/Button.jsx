// Button component
export default function Button({ children, className, ...props }) {
  return (
    <button className={`styled-button ${className}`} {...props}>
      {children}
    </button>
  );
}