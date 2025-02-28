import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Loading, Textbox } from "../components";
import { useLoginMutation } from "../redux/slices/api/authApiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { useEffect } from "react";


const Login = () => {
  const { user } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async (data) => {
    try {
      const res = await login(data).unwrap();

      dispatch(setCredentials(res));
      navigate("/");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  useEffect(() => {
    user && navigate("/dashboard");
  }, [user]);

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center flex-col lg:flex-row"
      style={{
        backgroundImage: "url('/src/img/background-image.png')", // Path ke gambar
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full md:w-auto flex gap-0 md:gap-40 flex-col md:flex-row items-center justify-center">
        <div className="w-full md:w-1/3 p-4 md:p-1 flex flex-col justify-right items-center">
          <form
            onSubmit={handleSubmit(handleLogin)}
            className="form-container w-full md:w-[400px] flex flex-col gap-y-8 bg-white dark:bg-slate-900 px-10 pt-14 pb-14"
          >
            <div>
              <p className="text-blue-600 text-3xl font-bold text-center">
                Welcome
              </p>
              <p className="text-center text-base text-gray-700 dark:text-gray-500">
                Healthcare Team
              </p>
            </div>
            <div className="flex flex-col gap-y-5">
              <Textbox
                placeholder="you@example.com"
                type="email"
                label="Email Address"
                className="w-full rounded-full"
                register={register("email", {
                  required: "Email Address is required!",
                })}
                error={errors.email ? errors.email.message : ""}
              />
              <Textbox
                placeholder="password"
                type="password"
                label="Password"
                className="w-full rounded-full"
                register={register("password", {
                  required: "Password is required!",
                })}
                error={errors.password ? errors.password?.message : ""}
              />
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  label="Register"
                  className="text-sm text-gray-600 hover:underline cursor-pointer"
                  onClick={() => navigate("/register")}
                />
              </div>
            </div>
            {isLoading ? (
              <Loading />
            ) : (
              <Button
                type="submit"
                label="Log in"
                className="w-full h-10 bg-blue-700 text-white rounded-full"
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
