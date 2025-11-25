import type { KeyboardEvent } from "react";
import { CiSearch } from "react-icons/ci";
import { IoIosCloseCircle } from "react-icons/io";

interface SearchBarProps {
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  className: string;
  value?: string;
  placeholder: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className,
  onChange,
  placeholder,
  onClear,
  value,
}) => {
  const showClear = value && value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <input
        readOnly={!onChange}
        value={value}
        onChange={onChange}
        type="search"
        className="outline-none pl-4 pr-8 w-full"
        placeholder={placeholder}
      />
      {showClear ? (
        <IoIosCloseCircle
          onClick={onClear}
          className="absolute text-2xl text-gray-300 top-2 right-1 cursor-pointer"
        />
      ) : (
        <CiSearch className="absolute text-2xl top-2 right-1 cursor-pointer" />
      )}
    </div>
  );
};

export default SearchBar;
