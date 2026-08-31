import type { ReactElement } from "react";

interface ButtonProps {
  variant: "primary" | "secondary";
  text: string;
  startIcon?: ReactElement;
  onClick?: () => void;
  fullWidth?:boolean;
  loading?:boolean;
}

const variantClasses = {
  primary: "bg-violet-600 text-white shadow-sm hover:bg-violet-700",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
};

const defaultStyles = "px-4 py-2.5 rounded-xl font-medium text-sm flex items-center transition-colors disabled:cursor-not-allowed";

const Button = ({ variant, text, startIcon, onClick , fullWidth,loading }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={variantClasses[variant] + " " + defaultStyles + `${fullWidth?" w-full flex justify-center items-center":""} ${loading?"opacity-45":""} ` } 
       disabled={loading}>
      <div className="pr-2">{startIcon}</div>
      {text}
    </button>
  );
};

export default Button;
