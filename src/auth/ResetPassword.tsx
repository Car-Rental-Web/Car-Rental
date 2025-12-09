import { useState } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  
     console.log(password)
     console.log(confirmPassword)

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }
    const {data, error } = await supabase.auth.updateUser({password:password})

    if(error) {
      console.log('Error Changing Password' , error)
      toast.error('Error Changing Password')
      return
    }

    console.log('Password Updated',data)
    navigate('/login')
  }

  return (
    <div className="bg-[url(assets/car.png)] h-screen w-full flex justify-center items-center bg-no-repeat bg-cover">
      <form  onSubmit={handleSubmit}className="w-96 border bg-black/75 border-gray-300 rounded py-4 px-6 flex flex-col gap-4">
        <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="New Password"
          className="w-full border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"
        />
        <input
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          placeholder="Confirm Password"
          className="w-full border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"
        />
        <button
          type="submit"
          className="w-full text-white py-3 cursor-pointer rounded bg-gray-800"
        >
          Confirm
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
