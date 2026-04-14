import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCreatorProfile, getApiErrorMessage } from '../../../api';
import toast from 'react-hot-toast';
import './CreatorProfile.scss';

const SOCIAL_PLATFORMS = [
  { key: 'youtube_url', label: 'YouTube' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'tiktok_url', label: 'TikTok' },
  { key: 'facebook_url', label: 'Facebook' },
];

const CreatorProfile = () => {
  const { userId } = useParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (userId) {
      fetchCreatorProfile();
    }
  }, [userId]);

  const fetchCreatorProfile = async () => {
    try {
      const data = await getCreatorProfile(userId);
      setCreator(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="creator-profile"><p>Loading...</p></div>;
  }

  if (!creator) {
    return <div className="creator-profile"><p>Creator not found</p></div>;
  }

  return (
    <div className="creator-profile">
      <div className="container">
        <div className="profile-header">
          <div className="left">
            <img
              src={creator?.user?.image || './media/noavatar.png'}
              alt={creator?.user?.username}
              className="profile-image"
            />
          </div>
          <div className="right">
            <h1>{creator?.user?.username}</h1>
            <p className="category">{creator?.category || 'Category not set'}</p>
            <p className="city">{creator?.user?.city}</p>

            <div className="stats">
              <div className="stat">
                <span className="value">{creator?.followers || 0}</span>
                <span className="label">Followers</span>
              </div>
              <div className="stat">
                <span className="value">{creator?.avg_views || 0}</span>
                <span className="label">Avg Views</span>
              </div>
              <div className="stat">
                <span className="value">{creator?.rating || 0}/5</span>
                <span className="label">Rating</span>
              </div>
              <div className="stat">
                <span className="value">{creator?.total_reviews || 0}</span>
                <span className="label">Reviews</span>
              </div>
            </div>

            <button className="contact-btn">Contact Creator</button>
          </div>
        </div>

        <div className="profile-content">
          <div className="bio-section">
            <h3>About</h3>
            <p>{creator?.bio || 'No bio added yet'}</p>
          </div>

          <div className="social-section">
            <h3>Social Presence</h3>
            <div className="social-links">
                {SOCIAL_PLATFORMS.map(({ key, label }) =>
                  creator?.[key] ? (
                    <a key={key} href={creator[key]} target="_blank" rel="noopener noreferrer" className="social-link">
                      {label}
                    </a>
                  ) : null
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;

