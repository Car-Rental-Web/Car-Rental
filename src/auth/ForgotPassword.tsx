import { useState } from "react";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  
    if(!email) return console.log("Please Enter your email")
      setIsLoading(true)
    const {data, error} = await supabase.auth.resetPasswordForEmail(email , {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    })

    if(error) {
      console.log('Error Sending Email', error)
      return
    }
    setIsLoading(false)
      toast.success('Reset Email Sent')
      console.log("Reset Email Sent:", data);
}

  return (
    <div className="bg-[url(assets/car.png)] h-screen w-full flex justify-center items-center bg-no-repeat bg-cover">
      <form onSubmit={(e) => {e.preventDefault()
        handleSubmit()}
      } className="w-96 border bg-black/75 border-gray-300 rounded py-4 px-6 flex flex-col gap-4">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="w-full text-white py-3 cursor-pointer rounded bg-gray-800"
        >
          {loading ? "Sending" : "Send"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
