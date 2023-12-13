import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/userApis';
import Loader from '../assets/images/Loading.svg';
import { Navbar } from '../components/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || '';

  const navigate = useNavigate();

  const validateForm = () => {
    if (!email) {
      setMessage('Email is required');
      return false;
    }
    if (!password) {
      setMessage('Password is required');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!validateForm()) return;
      const data = await loginUser({ email, password });
      toast.success('Logged in Successfully');
      setMessage('');
      setEmail('');
      setPassword('');
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setMessage(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center mx-auto shadow-xl mb-3 w-1/3 mt-10 bg-gray-100 rounded-sm">
        <div className="flex flex-col justify-start items-center h-full p-5">
          <h1 className="text-3xl font-bold mb-3">Login</h1>
          <form onSubmit={handleSubmit}>
            <div className="flex w-full mt-1 text-xl rounded-sm p-1">
              <input
                type="email"
                value={email}
                placeholder="Email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 border-2 shadow-lg"
              />
            </div>

            <div className="flex w-full mt-1 text-xl rounded-sm p-1">
              <input
                type="password"
                value={password}
                name="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 shadow-lg"
              />
            </div>
            <div className="flex justify-between my-3">
              <label className="flex items-center">
                <input type="checkbox" className="mx-1" />
                <p className="text-md">Remember Me</p>
              </label>
              <div>
                <Link to="/forget" className="text-md text-blue-500">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {isLoading ? (
              <img src={Loader} alt="Loading..." className="w-6 h-6 mx-auto" />
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 w-full font-bold border-2 text-white active:scale-95 text-xl py-2 rounded-sm border-none bg-blue-500 transition-all duration-100"
              >
                Login
              </button>
            )}

            {message && (
              <div>
                <p className="text-red-500 text-center">{message}</p>
              </div>
            )}

            <div className="flex justify-center text-center mt-5">
              <p className="text-lg">Don't have an account?</p>
              <Link
                to="/register"
                className="text-lg text-blue-500 underline font-bold"
              >
                Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default Login;
