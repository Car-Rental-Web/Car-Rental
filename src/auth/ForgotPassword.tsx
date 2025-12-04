const ForgotPassword = () => {
  return (
    <div className="bg-[url(assets/car.png)] h-screen w-full flex justify-center items-center bg-no-repeat bg-cover">
      <form action="" className="w-96 border bg-black/75 border-gray-300 rounded py-4 px-6 flex flex-col gap-5">
        <div className="flex flex-col">
          <label htmlFor="" className="text-white">New Password</label>
          <input type="text" className="border py-4 px-4 border-gray-400 rounded placeholder-white text-white" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="" className="text-white">Confirm Password</label>
          <input type="text" className="border py-4 px-4 border-gray-400 rounded placeholder-white text-white" />
        </div>
        <div>
          <button className="w-full text-white py-4 cursor-pointer rounded  bg-gray-800">Confirm</button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
