import React from "react";
import { useSelector } from "react-redux";
function Input(props) {
  const { isCurrentBreak } = useSelector((state) => state.break);
  const { type, errorMessage, addProps, touched, placeholder, ...inputProps } =
    props;
  return (
    <div>
      <label className="relative block cursor-text w-full">
        <input
          type={type}
          className={`${
            touched && errorMessage ? "border-primary" : "border-secondary"
          }  w-full peer border outline-none px-4 pt-2 ${
            isCurrentBreak ? "bg-gray-600" : "bg-white"
          }  ${addProps}`}
          required
          {...inputProps}
        />
        <span className="absolute text-black top-0 left-0 px-4 text-lg flex items-center h-full peer-focus:h-7 peer-focus:text-xs peer-valid:h-7 peer-valid:text-xs transition-all">
          {placeholder}
        </span>
      </label>
      {touched && <span className="text-sm text-primary">{errorMessage}</span>}
    </div>
  );
}

export default Input;
