import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import image from '../assets/images/bg.png';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="flex flex-col justify-center w-full z-10">
          <Navbar />
        </header>

        <main className="flex justify-left items-center h-full overflow-hidden w-full relative">
          <img
            src={image}
            alt="Jobs"
            className="absolute top-0 left-0 h-full w-full object-cover"
          />
          <div className="flex w-1/2 h-full overflow-hidden z-10">
            <div className="flex flex-col p-5 justify-center items-center rounded-sm bg-gray-200/60">
              <h1 className="text-4xl font-bold mb-4">Welcome to Z-jobs</h1>
              <p className="text-lg text-gray-600 mb-8">
                Track your job applications and stay organized throughout your
                job search.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="flex flex-col justify-center">
                  <h2 className="text-xl font-semibold mb-2">Why Z-jobs?</h2>
                  <p className="text-gray-700">
                    Our platform simplifies job tracking, allowing you to manage
                    applications seamlessly.
                  </p>
                </div>
              </div>

              {/* Call-to-action Button */}
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded mt-8 transition duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};
