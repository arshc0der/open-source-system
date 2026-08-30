import { createBrowserRouter, RouterProvider, Link, useNavigate } from 'react-router-dom';
import Home from './Pages/Home';


const About = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation

  return (
    <div>
      <h1>About Page</h1>
      <button onClick={() => navigate('/')}>Go Back Home</button>
    </div>
  );
};

// 2. Configure the paths and matching elements
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/about',
    element: <About />,
  },
]);

// 3. Render the Provider
export default function App() {
  return <RouterProvider router={router} />;
}
