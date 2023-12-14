import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/userApis';
import Loader from '../assets/images/Loading.svg';
import { FaAnglesLeft } from 'react-icons/fa6';

const Profile = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      localStorage.removeItem('userInfo');
      navigate('/');
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="flex flex-col w-1/5 border bg-gray-400 shadow-lg h-screen">
          <ul className="flex flex-col mx-auto w-full">
            <li className="flex flex-col items-center justify-center w-full h-24 bg-teal-300">
              <span className="rounded-full bg-blue-500 p-2 text-white font-bold">
                {userInfo.username.toUpperCase()}
              </span>
              <p>{userInfo.email}</p>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-10 hover:text-teal-800 hover:font-bold transition-all"
                to="/"
              >
                <FaAnglesLeft className="mr-5" />
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-20 hover:bg-teal-200 transition-all"
                to="/profile/account"
              >
                Account
              </NavLink>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-20 hover:bg-teal-200 transition-all"
                to={`/profile/${userInfo.username}`}
              >
                Profile
              </NavLink>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-20 hover:bg-teal-200 transition-all"
                to="/profile/jobs"
              >
                My Jobs
              </NavLink>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-20 hover:bg-teal-200 transition-all"
                to="/profile/settings"
              >
                Settings
              </NavLink>
            </li>
            <li>
              {isLoading ? (
                <img
                  src={Loader}
                  alt="Loading..."
                  className="w-10 h-10 mt-10 mx-auto"
                />
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex mx-auto mt-10 items-center rounded-md text-xl text-white border-2 px-5 py-1 bg-teal-500 hover:font-bold hover:bg-teal-700 active:scale-95 transition-all duration-100"
                >
                  Logout
                </button>
              )}
            </li>
          </ul>
        </div>
        <div className="flex flex-col w-full h-screen overflow-y-scroll justify-start items-start">
          <Outlet />
        </div>
      </div>
    </>
  );
};
export default Profile;
