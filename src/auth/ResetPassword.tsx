import { useState } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SeePassword from "../components/SeePassword";
import { useAuthStore } from "../store/useAuthStore";


const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return alert("Passwords do not match");
    }
    const {data, error } = await supabase.auth.updateUser({password:password})

    useAuthStore.getState().setRecoveringPassword(false)
    await supabase.auth.signOut()

    if(error) {
      console.log('Error Changing Password' , error)
      toast.error('Error Changing Password')
      return
    }

    console.log('Password Updated',data)
    toast.success('Password Updated Successfully')
    navigate('/login')
  }

  return (
    <div className="bg-[url(assets/car.png)] h-screen w-full flex justify-center items-center bg-no-repeat bg-cover">
      <form  onSubmit={handleSubmit}className="w-96 border bg-black/75 border-gray-300 rounded py-4 px-6 flex flex-col gap-4">
       <SeePassword onChange={(e) => setPassword(e.target.value)} value={password}  label="New Password" className="w-full border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"/>
        <SeePassword onChange={(e) => setConfirmPassword(e.target.value) } value={confirmPassword} label="Confirm NewPassword" className="w-full border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"/>
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
