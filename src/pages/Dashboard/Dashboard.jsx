import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { Navigate } from 'react-router-dom';
import { userState } from '../../atoms';
import { getDashboardPathByRole } from '../../api/session';

const Dashboard = () => {
  const user = useRecoilValue(userState);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return <div>Please log in to view your dashboard.</div>;
  }

  return <Navigate to={getDashboardPathByRole(user.role)} replace />;
};

export default Dashboard;

