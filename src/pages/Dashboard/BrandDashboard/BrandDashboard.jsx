import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { userState } from '../../../atoms';
import { getBrandProfile, getApiErrorMessage } from '../../../api';
import toast from 'react-hot-toast';
import './BrandDashboard.scss';

const BrandDashboard = () => {
  const user = useRecoilValue(userState);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.id) {
      fetchBrandProfile();
    }
  }, [user]);

  const fetchBrandProfile = async () => {
    try {
      const data = await getBrandProfile(user.id);
      setBrand(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="brand-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="brand-dashboard">
      <div className="container">
        <div className="header">
          <h1>Brand Dashboard</h1>
          <p>Welcome, {user?.username}!</p>
        </div>

        {brand ? (
          <div className="dashboard-content">
            <div className="profile-section">
              <div className="profile-header">
                <img
                  src={user?.image || './media/noavatar.png'}
                  alt={brand?.company_name}
                  className="profile-image"
                />
                <div className="profile-info">
                  <h2>{brand?.company_name}</h2>
                  <p className="industry">{brand?.industry || 'Industry not set'}</p>
                  <p className="city">{user?.city}</p>
                  {brand?.website && (
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="website-link">
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="description-section">
              <h3>About Your Brand</h3>
              <p>{brand?.description || 'No description added yet'}</p>
            </div>

            <div className="contact-section">
              <h3>Contact Information</h3>
              <div className="contact-info">
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Phone:</span>
                  <span className="value">{user?.phone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="label">City:</span>
                  <span className="value">{user?.city}</span>
                </div>
              </div>
            </div>

            <div className="actions">
              <button className="edit-btn">Edit Profile</button>
              <button className="find-creators-btn">Find Creators</button>
            </div>
          </div>
        ) : (
          <div className="no-profile">
            <p>No brand profile found. Please complete your profile setup.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDashboard;

