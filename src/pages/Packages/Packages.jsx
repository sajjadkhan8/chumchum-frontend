import { useState, useRef, useEffect } from 'react';
import { PackageCard, Loader } from '../../components';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { getApiErrorMessage, getPackages } from '../../api';
import { cards } from '../../data';
import toast from 'react-hot-toast';
import './Packages.scss';

const Packages = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [currentCategory, setCurrentCategory] = useState('all');
  const minRef = useRef();
  const maxRef = useRef();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const selectedCategory = searchParams.get('category') || 'all';
  const searchKeyword = searchParams.get('search') || '';
  const matchedCategory = cards.find((category) => category.slug === currentCategory);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setCurrentCategory(selectedCategory);
  }, [selectedCategory]);

  const { isLoading, error, data = [], refetch } = useQuery({
    queryKey: ['packages', search, sortBy],
    queryFn: async () => {
      const packages = await getPackages({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchKeyword || undefined,
        minPrice: minRef.current?.value,
        maxPrice: maxRef.current?.value,
        sort: sortBy,
      });

      if (packages[0]?.category) {
        setCurrentCategory(packages[0].category);
      }

      return packages;
    },
    onError: (apiError) => {
      toast.error(getApiErrorMessage(apiError));
    },
  });

  useEffect(() => {
    refetch();
  }, [sortBy, search, refetch]);

  const handleSortBy = (type) => {
    setSortBy(type);
    setOpenMenu(false);
  };

  const handlePriceFilter = () => {
    refetch();
  };

  let heading = matchedCategory?.title || (currentCategory[0]?.toUpperCase() + currentCategory.slice(1));
  if (currentCategory === 'all') {
    heading = 'Explore Packages';
  }
  if (searchKeyword) {
    heading = `Results for “${searchKeyword}”`;
  }

  let sortLabel = 'Newest';
  if (sortBy === 'featured') {
    sortLabel = 'Featured';
  } else if (sortBy === 'priceAsc') {
    sortLabel = 'Price: Low to High';
  }

  let cardsContent = <p>No packages found yet. Try a different category or price range.</p>;
  if (isLoading) {
    cardsContent = <div className='loader'> <Loader size={45} /> </div>;
  } else if (error) {
    cardsContent = 'Something went wrong!';
  } else if (data.length > 0) {
    cardsContent = data.map((packageItem) => <PackageCard key={packageItem.id} data={packageItem} />);
  }

  return (
    <div className='packages'>
      <div className="container">
        <span className="breadcrumbs">CHUMCHUM / PACKAGES / {heading.toUpperCase()}</span>
        <h1>{heading}</h1>
        <p>
          Discover creator packages tailored for ambitious brands — from one-off collaborations to ongoing subscription campaigns.
        </p>
        <div className="menu">
          <div className="left">
            <span>Budget</span>
            <input ref={minRef} type="number" placeholder='min' />
            <input ref={maxRef} type="number" placeholder='max' />
            <button onClick={handlePriceFilter}>Apply</button>
          </div>
          <div className="right">
            <span className='sortBy'>Sort By</span>
            <span className='sortType'>{sortLabel}</span>
            <button
              type="button"
              className="sort-toggle"
              aria-expanded={openMenu}
              aria-label="Open sort options"
              onClick={() => setOpenMenu(!openMenu)}
            >
              <img src="./media/down.png" alt="" aria-hidden="true" />
            </button>
            {openMenu && (
              <div className="rightMenu">
                {sortBy !== 'featured' && <button type="button" onClick={() => handleSortBy('featured')}>Featured</button>}
                {sortBy !== 'priceAsc' && <button type="button" onClick={() => handleSortBy('priceAsc')}>Price: Low to High</button>}
                {sortBy !== 'createdAt' && <button type="button" onClick={() => handleSortBy('createdAt')}>Newest</button>}
              </div>
            )}
          </div>
        </div>
        <div className="cards">
          {cardsContent}
        </div>
      </div>
    </div>
  );
};

export default Packages;

