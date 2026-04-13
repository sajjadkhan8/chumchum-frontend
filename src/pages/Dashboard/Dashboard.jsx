import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';
import CreatorDashboard from './CreatorDashboard/CreatorDashboard';
import BrandDashboard from './BrandDashboard/BrandDashboard';

const Dashboard = () => {
  const user = useRecoilValue(userState);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return <div>Please log in to view your dashboard.</div>;
  }

  return user?.role === 'CREATOR' ? <CreatorDashboard /> : <BrandDashboard />;
};

export default Dashboard;

