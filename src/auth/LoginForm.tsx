import { Link } from 'react-router-dom';

const LoginForm = () => {
  return (
    <div className="h-screen bg-[url(assets/car.png)] bg-no-repeat bg-cover flex justify-center items-center w-full ">
      <form
        action=""
        className="w-96 border bg-black/75 border-gray-300 rounded py-4 px-6 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="" className="text-white">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            className="border py-4 px-4 border-gray-400 rounded placeholder-white text-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="" className="text-white">
            Password
          </label>
          <input
            type="text"
            placeholder="Enter your password"
            className="border py-4 px-4 border-gray-400 rounded placeholder-white text-white"
          />
        </div>
            <Link to="/forgotpassword" className='text-white text-end text-sm'>Forgot Password?</Link>
        <div>
          <button
            type="button"
            className="w-full text-white py-4 cursor-pointer rounded  bg-gray-800"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
