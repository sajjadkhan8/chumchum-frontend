import PropTypes from "prop-types";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { RecoilRoot } from "recoil";
import { Navbar, PrivateRoute } from "./components";
import {
  Home,
  Footer,
  PackageDetails,
  Packages,
  MyPackages,
  Add,
  Orders,
  Message,
  Messages,
  Login,
  Register,
  Pay,
  Success,
  NotFound,
  Dashboard,
  CreatorDashboard,
  BrandDashboard,
  AdminDashboard,
  CreatorProfile,
  BrandProfile,
  Creators,
} from "./pages";
import "./App.scss";

const paths = [
  { path: "/", element: <Home /> },
  { path: "/package/:packageId", element: <PackageDetails /> },
  { path: "/gig/:_id", element: <PackageDetails /> },
  { path: "/packages", element: <Packages /> },
  { path: "/gigs", element: <Packages /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/orders",
    element: (
      <PrivateRoute>
        <Orders />
      </PrivateRoute>
    ),
  },
  {
    path: "/packages/new",
    element: (
      <PrivateRoute allowedRoles={["CREATOR"]}>
        <Add />
      </PrivateRoute>
    ),
  },
  {
    path: "/organize",
    element: (
      <PrivateRoute allowedRoles={["CREATOR"]}>
        <Add />
      </PrivateRoute>
    ),
  },
  {
    path: "/my-packages",
    element: (
      <PrivateRoute allowedRoles={["CREATOR"]}>
        <MyPackages />
      </PrivateRoute>
    ),
  },
  {
    path: "/my-gigs",
    element: (
      <PrivateRoute allowedRoles={["CREATOR"]}>
        <MyPackages />
      </PrivateRoute>
    ),
  },
  {
    path: "/message/:conversationID",
    element: (
      <PrivateRoute>
        <Message />
      </PrivateRoute>
    ),
  },
  {
    path: "/messages",
    element: (
      <PrivateRoute>
        <Messages />
      </PrivateRoute>
    ),
  },
  {
    path: "/pay/:packageId",
    element: (
      <PrivateRoute>
        <Pay />
      </PrivateRoute>
    ),
  },
  {
    path: "/pay/:_id",
    element: (
      <PrivateRoute>
        <Pay />
      </PrivateRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/creator/dashboard",
    element: (
      <PrivateRoute allowedRoles={["CREATOR"]}>
        <CreatorDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/brand/dashboard",
    element: (
      <PrivateRoute allowedRoles={["BRAND"]}>
        <BrandDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <PrivateRoute allowedRoles={["ADMIN"]}>
        <AdminDashboard />
      </PrivateRoute>
    ),
  },
  { path: "/creator/:creatorId", element: <CreatorProfile /> },
  { path: "/brand/:brandId", element: <BrandProfile /> },
  { path: "/creators", element: <Creators /> },
  {
    path: "/success",
    element: (
      <PrivateRoute>
        <Success />
      </PrivateRoute>
    ),
  },
  { path: "*", element: <NotFound /> },
];

const Layout = ({ queryClient }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <Outlet />
      <Footer />
    </QueryClientProvider>
  );
};

Layout.propTypes = {
  queryClient: PropTypes.instanceOf(QueryClient).isRequired,
};

function App() {
  const queryClient = new QueryClient();
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout queryClient={queryClient} />,
      children: paths.map(({ path, element }) => ({ path, element })),
    },
  ]);

  return (
    <div className="App">
      <RecoilRoot>
        <RouterProvider router={router} />
        <Toaster />
      </RecoilRoot>
    </div>
  );
}

export default App;
