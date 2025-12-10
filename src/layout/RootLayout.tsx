// import { useEffect } from "react"
import SideBar from "../common/SideBar"
import {Outlet} from 'react-router-dom'
import Header from "../common/Header"

const RootLayout = () => {
    // const location = useLocation()
    // const navigate = useNavigate()

    // useEffect (() => {
    //     const redirect = () => {
    //         location.pathname === "/admin" && navigate("dashboard")
    //     }
    //     redirect()
    // },[location,navigate])

  return (
      <div className="flex  w-full max-w-[3000px]  mx-auto ">
        <SideBar/>
        <main className=" w-full flex flex-col h-full">
        <Header/>
            <Outlet/>
        </main>
    </div>
    
  )
}

export default RootLayout