import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/userApis';
import { toast } from 'react-toastify';
import Loader from '../assets/images/Loading.svg';

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
      <div className="flex justify-center mx-auto shadow-xl p-5 mb-5 w-1/3 mt-10">
        <div className="flex flex-col justify-start items-center h-96 p-5">
          <h1 className="text-3xl font-bold mb-5">Register</h1>
          <form onSubmit={handleSubmit}>
            <div className="flex w-full mt-3 border text-xl rounded-sm p-1">
              <input
                type="text"
                value={username}
                placeholder="Name"
                name="name"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
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
            <div className="flex w-full mt-3 border text-xl rounded-sm p-1">
              <input
                type="password"
                value={confirmPassword}
                name="confirmPassword"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                'Register'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
export default Register;
