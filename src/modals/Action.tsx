import { useState } from "react";
import { BsThreeDots } from "react-icons/bs";

const Action = () => {
  const [open, SetOpen] = useState(false);
  return (
    <div className="">
      <button onClick={() => SetOpen(!open)}>
        <BsThreeDots />
      </button>
      {open && (
        <div>
          <div>View</div>
          <div>Edit</div>
          <div>Delete</div>
        </div>
      )}
    </div>
  );
};
export default Action;
