import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { userState } from '../../../atoms';
import { getCreatorProfile, getApiErrorMessage } from '../../../api';
import toast from 'react-hot-toast';
import './CreatorDashboard.scss';

const CreatorDashboard = () => {
  const user = useRecoilValue(userState);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.id) {
      fetchCreatorProfile();
    }
  }, [user]);

  const fetchCreatorProfile = async () => {
    try {
      const data = await getCreatorProfile(user.id);
      setCreator(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="creator-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="creator-dashboard">
      <div className="container">
        <div className="header">
          <h1>Creator Dashboard</h1>
          <p>Welcome, {user?.username}!</p>
        </div>

        {creator ? (
          <div className="dashboard-content">
            <div className="profile-section">
              <div className="profile-header">
                <img
                  src={user?.image || './media/noavatar.png'}
                  alt={user?.username}
                  className="profile-image"
                />
                <div className="profile-info">
                  <h2>{user?.username}</h2>
                  <p className="category">{creator?.category || 'Category not set'}</p>
                  <p className="city">{user?.city}</p>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{creator?.followers || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{creator?.avg_views || 0}</span>
                  <span className="stat-label">Avg Views</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{creator?.engagement_rate || 0}%</span>
                  <span className="stat-label">Engagement</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{creator?.rating || 0}</span>
                  <span className="stat-label">Rating</span>
                </div>
              </div>
            </div>

            <div className="bio-section">
              <h3>Bio</h3>
              <p>{creator?.bio || 'No bio added yet'}</p>
            </div>

            <div className="social-section">
              <h3>Social Links</h3>
              <div className="social-links">
                {creator?.tiktok_url && (
                  <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer">
                    <img src="./media/tiktok.png" alt="TikTok" />
                    TikTok
                  </a>
                )}
                {creator?.instagram_url && (
                  <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer">
                    <img src="./media/instagram.png" alt="Instagram" />
                    Instagram
                  </a>
                )}
                {creator?.youtube_url && (
                  <a href={creator.youtube_url} target="_blank" rel="noopener noreferrer">
                    <img src="./media/youtube.png" alt="YouTube" />
                    YouTube
                  </a>
                )}
              </div>
            </div>

            <div className="actions">
              <button className="edit-btn">Edit Profile</button>
              <button className="view-gigs-btn">View My Services</button>
            </div>
          </div>
        ) : (
          <div className="no-profile">
            <p>No creator profile found. Please complete your profile setup.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;

