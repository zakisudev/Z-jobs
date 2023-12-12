import { NavLink, Outlet } from 'react-router-dom';

const Profile = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return (
    <>
      <div className="flex gap-2">
        <div className="flex flex-col w-1/5 border bg-gray-400 shadow-lg h-screen">
          <ul className="flex flex-col mx-auto w-full">
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-32 hover:bg-teal-200 transition-all"
                to="/profile/account"
              >
                Account
              </NavLink>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-32 hover:bg-teal-200 transition-all"
                to={`/profile/${userInfo.username}`}
              >
                Profile
              </NavLink>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-32 hover:bg-teal-200 transition-all"
                to="/profile/jobs"
              >
                My Jobs
              </NavLink>
            </li>
            <li>
              <NavLink
                className="flex pl-10 items-center text-xl w-full h-32 hover:bg-teal-200 transition-all"
                to="/profile/settings"
              >
                My Jobs
              </NavLink>
            </li>
            <li>
              <button className="flex mx-auto mt-10 items-center rounded-md text-xl text-white border-2 px-5 py-1 bg-teal-500 hover:font-bold hover:bg-teal-700 active:scale-95 transition-all duration-100">
                Logout
              </button>
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
