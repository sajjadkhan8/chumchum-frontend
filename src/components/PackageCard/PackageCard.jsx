import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './PackageCard.scss';

const userShape = PropTypes.shape({
  username: PropTypes.string,
  image: PropTypes.string,
});

const creatorShape = PropTypes.shape({
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  total_reviews: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  user: userShape,
});

const legacyUserShape = PropTypes.shape({
  username: PropTypes.string,
  image: PropTypes.string,
});

const packageCardShape = PropTypes.shape({
  id: PropTypes.string,
  title: PropTypes.string,
  cover_image: PropTypes.string,
  cover: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currency: PropTypes.string,
  pricing_type: PropTypes.string,
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  totalReviews: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  creator: creatorShape,
  userID: legacyUserShape,
});

const PackageCard = ({ data }) => {
  const creatorName = data?.creator?.user?.username || data?.userID?.username || 'Creator';
  const creatorImage = data?.creator?.user?.image || data?.userID?.image || './media/noavatar.png';
  const rating = Number(data?.creator?.rating ?? data?.rating ?? 0);
  const totalReviews = Number(data?.creator?.total_reviews ?? data?.totalReviews ?? 0);

  return (
    <Link to={`/package/${data.id}`} className="link">
      <div className="packageCard">
        <img src={data.cover_image || data.cover || './media/noavatar.png'} alt={data.title} />
        <div className="info">
          <div className="user">
            <img src={creatorImage} alt={creatorName} />
            <span>{creatorName}</span>
          </div>
          <p>{data.title}</p>
          <div className="star">
            <img src="./media/star.png" alt="rating" />
            <span>{rating.toFixed(1)}</span>
            <span className='totalStars'>({totalReviews})</span>
          </div>
        </div>
        <hr />
        <div className="detail">
          <img src="./media/heart.png" alt="Save package" />
          <div className="price">
            {data.pricing_type === 'BARTER' ? (
              <>
                <span>COLLAB TYPE</span>
                <h2>🎁 Barter Deal</h2>
              </>
            ) : (
              <>
                <span>STARTING AT</span>
                <h2>
                  {Number(data.price || 0).toLocaleString('en-PK', {
                    maximumFractionDigits: 0,
                    style: 'currency',
                    currency: data.currency || 'PKR',
                  })}
                </h2>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

PackageCard.propTypes = {
  data: packageCardShape.isRequired,
};

export default PackageCard;

