import { useState } from "react";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signUp = useAuthStore((state) => state.signUp)

  console.log(email);
  console.log(password);
  const handleSubmit = async () => {
    const {  error } = await signUp(email,password);
    if(error) {
      toast.error(error.message)
    }
    toast.success("Sign Up successfull!")
  };

  return (
    <div className="flex justify-center items-center w-full h-screen ">
      {/* bg-[url(assets/car.png)] bg-no-repeat bg-cover */}
      <form
      className="border border-gray-400 px-4 py-2 rounded flex flex-col items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        action=""
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="border py-3 px-4 border-gray-400 rounded placeholder-gray-400  bg-transparent"
            placeholder="email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="">password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="border py-3 px-4 border-gray-400 rounded placeholder-gray-400  bg-transparent"
            placeholder="password"
          />
        </div>
        <button type="submit" className="border border-gray-400 rounded py-2 px-4  cursor-pointer w-full">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
