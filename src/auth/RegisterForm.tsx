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
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        action=""
      >
        <div>
          <label htmlFor="">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="border py-3 px-4 border-gray-400 rounded placeholder-gray-400  bg-transparent"
            placeholder="email"
          />
        </div>
        <div>
          <label htmlFor="">password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="border py-3 px-4 border-gray-400 rounded placeholder-gray-400  bg-transparent"
            placeholder="password"
          />
        </div>
        <button type="submit" className="">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
