import { useEffect, useState } from 'react';
import { updateUserProfile } from '../services/userApis';
import { toast } from 'react-toastify';
import Loader from '../assets/images/Loading.svg';

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'));
  const [username, setName] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      setMessage('');
    }
  }, [password, confirmPassword]);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const data = await updateUserProfile({
        username,
        email,
        password,
        oldPassword,
      });
      if (data) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        toast.success('Profile updated successfully');
        setMessage('');
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMessage(error.message);
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex justify-start items-start w-full">
        <div className="flex flex-col w-1/2">
          <h1 className="text-2xl font-bold my-5 ml-5">Profile</h1>
          <form className="flex flex-col gap-5 border-4 px-5 w-3/4 ml-5">
            <h1 className="text-xl font-bold">User Information</h1>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="border-2 border-gray-300 rounded-md p-2"
                    value={username}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="border-2 border-gray-300 rounded-md p-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    className="border-2 border-gray-300 rounded-md p-2"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="flex flex-col">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    className="border-2 border-gray-300 rounded-md p-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="flex flex-col">
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    className="border-2 border-gray-300 rounded-md p-2"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
            {message && (
              <div className="bg-red-300 p-2 rounded-md text-white">
                {message}
              </div>
            )}
            <button
              onClick={handleUpdateProfile}
              disabled={isLoading}
              className="bg-blue-500 text-white p-2 my-2 mb-4 rounded-md"
            >
              {isLoading ? (
                <img src={Loader} alt="loader" className="w-6 h-6 mx-auto" />
              ) : (
                'Update'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
