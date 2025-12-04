import { Link, useNavigate } from "react-router-dom";
import SeePassword from "../components/SeePassword";
import { useForm } from "react-hook-form";
import { LoginFormSchema, type LoginFormData } from "../schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useAuthStore } from "../store/AuthStore";
import { supabase } from "../utils/supabase";
import { toast } from "react-toastify";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    const email = data.email;
    const password = data.password;
    const { data: user, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (user?.user) {
      toast.success("Login Successfully");
      login(user.user);
      navigate("/dashboard");
    }
  };

  return (
    <div className="h-screen bg-[url(assets/car.png)] bg-no-repeat bg-cover flex justify-center items-center w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-96 border bg-black/75 border-gray-300 rounded py-6 px-6 flex flex-col gap-5"
      >
        <h2 className="text-white text-2xl font-semibold text-center">Login</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-white">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            id="email"
            placeholder="Enter your email"
            className="border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <SeePassword
          {...register("password")}
          label="Password"
          className="w-full border py-3 px-4 border-gray-400 rounded placeholder-gray-400 text-white bg-transparent"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}

        <Link to="/forgotpassword" className="text-white text-end text-sm">
          Forgot Password?
        </Link>

        <button
          type="submit"
          className="w-full text-white py-3 rounded bg-gray-800 disabled:opacity-50 cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
