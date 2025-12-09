import { useState } from "react";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  console.log(email);
  console.log(password);
  const handleSubmit = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (!email.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
        }
    if (error) {
        toast.error("This email is already registered. Try logging in.");
        toast.error(error.message);
        return;
    }
    console.log("Signup Successfully", data);
    setEmail("");
    setPassword("");
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
          Submit
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
