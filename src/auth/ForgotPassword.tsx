import { useState } from "react";


const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  

  return (
    <div className="bg-[url(assets/car.png)] h-screen w-full flex justify-center items-center bg-no-repeat bg-cover">
      <form className="w-96 border bg-black/75 border-gray-300 rounded py-4 px-6 flex flex-col gap-4">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          className="w-full text-white py-3 cursor-pointer rounded bg-gray-800"
        >
          Send Reset Email
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
