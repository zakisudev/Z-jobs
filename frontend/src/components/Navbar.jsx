import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMdArrowDropdown } from 'react-icons/io';

export const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    }
    document.addEventListener('click', (e) => {
      if (e.target.id !== 'options-menu') {
        setShowDropdown(false);
      }
    });
  }, [navigate, userInfo]);

  return (
    <>
      <nav className="bg-gray-200 h-16 w-full">
        <div className="flex justify-between items-center mx-10 h-full">
          <div className="text-center rounded-xl border bg-teal-500 px-5 py-1">
            <Link to="/" className="text-2xl font-bold">
              <h1>Z-Jobs</h1>
            </Link>
          </div>
          <div className="flex gap-2">
            <div className="text-center px-5 rounded-lg hover:bg-gray-300 py-1">
              <Link to="/about" className="text-2xl font-bold">
                <h1>About</h1>
              </Link>
            </div>
            <div className="text-center px-5 rounded-lg hover:bg-gray-300 py-1">
              <Link to="/contact" className="text-2xl font-bold">
                <h1>Contact</h1>
              </Link>
            </div>

            {userInfo && (
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  id="options-menu"
                >
                  {userInfo.username.replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                  )}
                  <IoMdArrowDropdown className="ml-2 -mr-1 h-5 w-5" />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/profile');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!userInfo && (
              <div className="flex gap-2">
                <div className="text-center px-5 rounded-lg hover:bg-gray-300 py-1">
                  <a href="/login" className="text-2xl font-bold">
                    <h1>Login</h1>
                  </a>
                </div>
                <div className="text-center px-5 rounded-lg bg-blue-500 py-1">
                  <a href="/register" className="text-2xl font-bold">
                    <h1>Register</h1>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};