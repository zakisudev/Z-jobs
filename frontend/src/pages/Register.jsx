import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/userApis';
import { toast } from 'react-toastify';
import Loader from '../assets/images/Loading.svg';
import { Navbar } from '../components/Navbar';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const navigate = useNavigate();

  const validateForm = () => {
    if (!username) {
      setMessage('Name is required');
      return false;
    }
    if (!email) {
      setMessage('Email is required');
      return false;
    }
    if (!password) {
      setMessage('Password is required');
      return false;
    }
    if (!confirmPassword) {
      setMessage('Confirm Password is required');
      return false;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do must match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!validateForm()) return;
      const data = await registerUser({
        username,
        email,
        password,
        confirmPassword,
      });
      toast.success('Registered Successfully');
      setMessage('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setMessage(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  return (
    <>
      <Navbar />
      <div className="flex justify-center mx-auto shadow-xl pb-20 h-auto mb-5 w-1/3 mt-10 bg-gray-100 rounded-sm">
        <div className="flex flex-col justify-start items-center h-96 p-5">
          <h1 className="text-3xl font-bold mb-2">Register</h1>
          <form onSubmit={handleSubmit}>
            <div className="flex w-full mt-1 text-xl rounded-sm p-1">
              <input
                type="text"
                value={username}
                placeholder="Name"
                name="name"
                onChange={(e) => setUsername(e.target.value)}
                className="p-2 shadow-lg"
                required
              />
            </div>
            <div className="flex w-full mt-1 text-xl rounded-sm p-1">
              <input
                type="email"
                value={email}
                placeholder="Email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 shadow-lg"
                required
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
                required
              />
            </div>
            <div className="flex w-full mt-1 text-xl rounded-sm p-1">
              <input
                type="password"
                value={confirmPassword}
                name="confirmPassword"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="p-2 shadow-lg"
                required
              />
            </div>

            {isLoading ? (
              <img
                src={Loader}
                alt="Loading..."
                className="w-10 h-10 mx-auto my-3"
              />
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 w-full font-bold  text-white active:scale-95 text-xl py-2 rounded-sm border-none bg-blue-500 transition-all duration-100"
              >
                Register
              </button>
            )}

            {message && (
              <div>
                <p className="text-red-500 text-center font-bold">{message}</p>
              </div>
            )}

            <div className="flex text-center mt-5">
              <p className="text-lg">Already have an account?</p>
              <button
                onClick={() => navigate('/login')}
                className="text-lg text-blue-500 underline font-bold"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default Register;
