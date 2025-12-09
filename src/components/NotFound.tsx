import { useNavigate } from "react-router-dom"

const NotFound = () => {
    const navigate = useNavigate()
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center">   
            <p>Nothing to see here</p>
            <button onClick={() => navigate(-1)} className="border py-2 px-4 rounded cursor-pointer" >Go back</button>
    </div>
  )
}

export default NotFound