import { useState, forwardRef } from "react";
import icons from "../constants/icon";

interface SeePasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className: string;
}

const SeePassword = forwardRef<HTMLInputElement, SeePasswordProps>(
  ({ label, className, ...inputProps }, ref) => {
    const [SeePassword, setSeePassword] = useState(false);

    return (
      <div className="relative flex flex-col gap-2">
        <label htmlFor="" className="text-white">
          {label}
        </label>
        <input
          {...inputProps}
          ref={ref}
          type={`${SeePassword ? "text" : "password"}`}
          placeholder="Enter your Password"
          className={className}
        />
        <button
          className="absolute text-white right-3 bottom-5 cursor-pointer"
          type="button"
          onClick={() => setSeePassword(!SeePassword)}
        >
          {SeePassword ? <icons.openEye /> : <icons.closeEye />}
        </button>
      </div>
    );
  }
);

export default SeePassword;
