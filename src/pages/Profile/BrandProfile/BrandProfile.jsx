import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBrandById, getApiErrorMessage } from '../../../api';
import toast from 'react-hot-toast';
import './BrandProfile.scss';

const BrandProfile = () => {
  const { brandId } = useParams();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (brandId) {
      fetchBrandProfile();
    }
  }, [brandId]);

  const fetchBrandProfile = async () => {
    try {
      const data = await getBrandById(brandId);
      setBrand(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="brand-profile"><p>Loading...</p></div>;
  }

  if (!brand) {
    return <div className="brand-profile"><p>Brand not found</p></div>;
  }

  return (
    <div className="brand-profile">
      <div className="container">
        <div className="profile-header">
          <div className="left">
            <img
              src={brand?.user?.image || './media/noavatar.png'}
              alt={brand?.company_name}
              className="profile-image"
            />
          </div>
          <div className="right">
            <h1>{brand?.company_name}</h1>
            <p className="industry">{brand?.industry || 'Industry not set'}</p>
            <p className="city">{brand?.user?.city}</p>

            {brand?.website && (
              <a href={brand.website} target="_blank" rel="noopener noreferrer" className="website-link">
                Visit Website →
              </a>
            )}

            <button className="contact-btn">Contact Brand</button>
          </div>
        </div>

        <div className="profile-content">
          <div className="description-section">
            <h3>About the Brand</h3>
            <p>{brand?.description || 'No description added yet'}</p>
          </div>

          <div className="info-section">
            <h3>Contact Information</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{brand?.user?.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Phone:</span>
                <span className="value">{brand?.user?.phone || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="label">City:</span>
                <span className="value">{brand?.user?.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandProfile;

