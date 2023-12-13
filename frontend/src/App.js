import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Home } from './pages/Home';
import { About } from './pages/About';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import AccountProfile from './pages/AccountProfile';
import ProfileDetails from './pages/ProfileDetails';
import MyJobs from './pages/MyJobs';
import Settings from './pages/Settings';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index={true} element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/profile" element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />}>
          <Route index element={<AccountProfile />} />
          <Route path=":name" element={<ProfileDetails />} />
          <Route path="jobs" element={<MyJobs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Route>
  )
);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
      />
    </>
  );
}

export default App;
