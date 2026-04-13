import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiErrorMessage, getPackageById } from '../../api';
import { Link, useParams } from 'react-router-dom';
import { Loader, NextArrow, PrevArrow, Reviews } from '../../components';
import './PackageDetails.scss';

import { CarouselProvider, Slider, Slide, ButtonBack, ButtonNext, Image } from 'pure-react-carousel';
import 'pure-react-carousel/dist/react-carousel.es.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const formatCurrency = (amount, currency = 'PKR') =>
  Number(amount || 0).toLocaleString('en-PK', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency,
  });

const formatLabel = (value) =>
  value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const renderMetaCard = (data, packageId, isMobile = false) => {
  const wrapperClass = isMobile ? 'right-mobile' : 'right';
  const actionLabel = data?.pricing_type === 'BARTER' ? 'Request Collaboration' : 'Continue';

  return (
    <div className={wrapperClass}>
      <div className="price">
        <h3>{data?.platform ? `${formatLabel(data.platform)} Package` : 'Creator Package'}</h3>
        <h2>{formatCurrency(data?.price, data?.currency)}</h2>
      </div>
      <p>
        {data?.shortDescription || data?.description}
      </p>
      <div className="details">
        <div className="item">
          <img src="/media/down.png" alt="delivery timeline" />
          <span>{data?.delivery_days} days Delivery</span>
        </div>
        <div className="item">
          <img src="/media/check.png" alt="revisions" />
          <span>{data?.revisions} Revisions</span>
        </div>
      </div>
      <div className="features">
        {data?.deliverables.map((deliverable) => (
          <div key={deliverable} className="item">
            <img src="/media/check.png" alt="Included" />
            <span>{deliverable}</span>
          </div>
        ))}
      </div>

      {data?.pricing_type === 'BARTER' && data?.barter_details && (
        <div className="barter-box">
          <h4>Barter Details</h4>
          <p>{data.barter_details}</p>
        </div>
      )}

      {data?.tiers?.length > 0 && (
        <div className="tiers">
          <h4>Package Tiers</h4>
          {data.tiers.map((tier) => (
            <div key={tier.id || tier.name} className="tier-item">
              <div>
                <strong>{formatLabel(tier.name)}</strong>
                <span>{tier.delivery_days} days</span>
              </div>
              <span>{formatCurrency(tier.price, data.currency)}</span>
            </div>
          ))}
        </div>
      )}

      <Link to={`/pay/${packageId}`}>
        <button>{actionLabel}</button>
      </Link>
    </div>
  );
};

const PackageDetails = () => {
  const { packageId, _id } = useParams();
  const resolvedPackageId = packageId || _id;

  const { isLoading, error, data } = useQuery({
    queryKey: ['package', resolvedPackageId],
    queryFn: () => getPackageById(resolvedPackageId),
    onError: (apiError) => {
      toast.error(getApiErrorMessage(apiError));
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return <div className='packageDetails'><div className='loader'> <Loader /> </div></div>;
  }

  if (error || !data) {
    return <div className='packageDetails'>Something went wrong!</div>;
  }

  const creatorUser = data.creator?.user || data.userID || {};
  const rating = Number(data.creator?.rating || 0);
  const totalReviews = Number(data.creator?.total_reviews || 0);
  const packageImages = [data.cover_image, ...(data.media_urls || [])].filter(Boolean);
  const creatorJoined = creatorUser.createdAt
    ? `${MONTHS[new Date(creatorUser.createdAt).getMonth()]} ${new Date(creatorUser.createdAt).getFullYear()}`
    : 'Recently joined';

  return (
    <div className="packageDetails">
      <div className="container">
        <div className="left">
          <span className="breadcrumbs">ChumChum / Packages / {data.category || 'Creator Package'}</span>
          <h1>{data.title}</h1>
          <div className="user">
            <img
              className="pp"
              src={creatorUser.image || '/media/noavatar.png'}
              alt={creatorUser.username || 'Creator'}
            />
            <span>{creatorUser.username || 'Creator'}</span>
            {rating > 0 && (
              <div className="stars">
                {new Array(Math.round(rating)).fill(0).map((_, index) => (
                  <img src="/media/star.png" key={index} alt="star" />
                ))}
                <span>{rating.toFixed(1)} ({totalReviews})</span>
              </div>
            )}
          </div>

          <CarouselProvider
            naturalSlideHeight={100}
            naturalSlideWidth={125}
            totalSlides={packageImages.length || 1}
            infinite
            className='slider'
          >
            <Slider>
              {(packageImages.length ? packageImages : ['/media/noavatar.png']).map((imageUrl) => (
                <Slide key={imageUrl}>
                  <Image src={imageUrl} alt={data.title} />
                </Slide>
              ))}
            </Slider>

            <ButtonBack>
              <PrevArrow />
            </ButtonBack>

            <ButtonNext>
              <NextArrow />
            </ButtonNext>
          </CarouselProvider>

          {renderMetaCard(data, resolvedPackageId, true)}

          <h2>About This Package</h2>
          <p>{data.description}</p>

          {data.tags?.length > 0 && (
            <div className="tag-list">
              {data.tags.map((tag) => (
                <span key={tag} className="tag-chip">#{tag}</span>
              ))}
            </div>
          )}

          <div className="seller">
            <h2>About The Creator</h2>
            <div className="user">
              <img src={creatorUser.image || '/media/noavatar.png'} alt={creatorUser.username || 'Creator'} />
              <div className="info">
                <span>{creatorUser.username || 'Creator'}</span>
                {rating > 0 && (
                  <div className="stars">
                    {new Array(Math.round(rating)).fill(0).map((_, index) => (
                      <img src="/media/star.png" key={index} alt="star" />
                    ))}
                    <span>{rating.toFixed(1)}</span>
                  </div>
                )}
                <button>Contact Creator</button>
              </div>
            </div>
            <div className="box">
              <div className="items">
                <div className="item">
                  <span className="title">City</span>
                  <span className="desc">{creatorUser.city || 'Pakistan'}</span>
                </div>
                <div className="item">
                  <span className="title">Member since</span>
                  <span className="desc">{creatorJoined}</span>
                </div>
                <div className="item">
                  <span className="title">Category</span>
                  <span className="desc">{data.creator?.category || data.category || 'General'}</span>
                </div>
                <div className="item">
                  <span className="title">Platform</span>
                  <span className="desc">{formatLabel(data.platform)}</span>
                </div>
                <div className="item">
                  <span className="title">Package type</span>
                  <span className="desc">{formatLabel(data.type)}</span>
                </div>
              </div>
              <hr />
              <p>{data.creator?.bio || creatorUser.description || 'This creator has not added a bio yet.'}</p>
            </div>
          </div>
          <Reviews packageId={resolvedPackageId} />
        </div>
        {renderMetaCard(data, resolvedPackageId)}
      </div>
    </div>
  );
};

export default PackageDetails;


