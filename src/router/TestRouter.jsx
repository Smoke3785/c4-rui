import { createBrowserRouter, RouterProvider } from "react-router-dom";

//   Routes
import TestDashboard from "../App";
import TestMaps from "../pages/TestMaps";
import { withState } from "../context/appContext";
import Debug from "../pages/Debug";

const router = createBrowserRouter([
  {
    path: "/",
    element: <TestDashboard />,
  },
  {
    path: "/maps",
    element: <TestMaps />,
  },
  {
    path: "/debug",
    element: <Debug />,
  },
]);

const Router = () => {
  return <RouterProvider router={router} />;
};

const NoStateRouter = Router;

export { NoStateRouter };

export default Router;
