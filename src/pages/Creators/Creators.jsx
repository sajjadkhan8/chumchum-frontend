import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCreators, getApiErrorMessage } from '../../api';
import toast from 'react-hot-toast';
import './Creators.scss';

const Creators = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const data = await getCreators();
      setCreators(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredCreators = creators.filter(creator => {
    const matchesSearch =
      creator.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || creator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(creators.map(c => c.category).filter(Boolean))];

  if (loading) {
    return <div className="creators"><p>Loading creators...</p></div>;
  }

  return (
    <div className="creators">
      <div className="header">
        <div className="container">
          <h1>Discover Creators</h1>
          <p>Find the perfect creator for your brand collaboration</p>
        </div>
      </div>

      <div className="container">
        <div className="filters">
          <div className="search-box">
            <img src="./media/search.png" alt="search" />
            <input
              type="search"
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCreators.length === 0 ? (
          <div className="no-results">
            <p>No creators found matching your criteria</p>
          </div>
        ) : (
          <div className="creators-grid">
            {filteredCreators.map((creator) => (
              <Link
                key={creator.id}
                to={`/creator/${creator.id}`}
                className="creator-card"
              >
                <div className="image-wrapper">
                  <img
                    src={creator.user?.image || './media/noavatar.png'}
                    alt={creator.user?.username}
                  />
                </div>
                <div className="info">
                  <h3>{creator.user?.username}</h3>
                  <p className="category">{creator.category || 'No category'}</p>
                  <p className="city">{creator.user?.city}</p>

                  <div className="stats">
                    <div className="stat">
                      <span className="value">{creator.followers || 0}</span>
                      <span className="label">Followers</span>
                    </div>
                    <div className="stat">
                      <span className="value">{creator.rating || 0}</span>
                      <span className="label">Rating</span>
                    </div>
                  </div>

                  <p className="bio">{creator.bio?.substring(0, 80)}...</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Creators;

