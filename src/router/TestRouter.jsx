import { createBrowserRouter, RouterProvider } from "react-router-dom";

//   Routes
import TestDashboard from "../App";
import TestMaps from "../pages/TestMaps";
import { withState } from "../context/appContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <TestDashboard />,
  },
  {
    path: "/maps",
    element: <TestMaps />,
  },
]);

const Router = () => {
  return <RouterProvider router={router} />;
};

const NoStateRouter = Router;

export { NoStateRouter };

export default Router;
