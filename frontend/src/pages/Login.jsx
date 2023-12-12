import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/userApis';
import Loader from '../assets/images/Loading.svg';

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
      <div className="flex justify-center mx-auto shadow-xl p-5 mb-5 w-1/3 mt-10">
        <div className="flex flex-col justify-start items-center h-96 p-5">
          <h1 className="text-3xl font-bold mb-5">Login</h1>
          <form onSubmit={handleSubmit}>
            <div className="flex w-full mt-3 border text-xl rounded-sm p-1">
              <input
                type="email"
                value={email}
                placeholder="Email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex w-full mt-3 border text-xl rounded-sm p-1">
              <input
                type="password"
                value={password}
                name="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && (
              <div>
                <p className="text-red-500 text-center py-2">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 w-full font-bold  text-white active:scale-95 text-xl p-1 rounded-sm border-none bg-blue-500 transition-all duration-100"
            >
              {isLoading ? (
                <img
                  src={Loader}
                  alt="Loading..."
                  className="w-6 h-6 mx-auto"
                />
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
export default Login;
