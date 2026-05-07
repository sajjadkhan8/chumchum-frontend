import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePackage, getApiErrorMessage, getCreatorProfile, getPackages } from '../../api';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';
import { Loader } from '../../components';
import { formatSupportedPlatformLabel } from '../../utils/platforms';
import './MyPackages.scss';

const formatPlatform = (platform) => (platform ? formatSupportedPlatformLabel(platform) : '—');

const formatPrice = (price, currency) =>
  Number(price || 0).toLocaleString('en-PK', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: currency || 'PKR',
  });

const MyPackages = () => {
  const user = useRecoilValue(userState);
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { isLoading, error, data = [] } = useQuery({
    queryKey: ['my-packages', user?.id],
    enabled: !!user?.id && user?.role === 'CREATOR',
    queryFn: async () => {
      const creator = await getCreatorProfile(user.id);
      return getPackages({ creatorId: creator.id });
    },
  });

  const mutation = useMutation({
    mutationFn: (packageId) => deletePackage(packageId),
    onError: (apiError) => {
      toast.error(getApiErrorMessage(apiError));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const handlePackageDelete = (packageItem, event) => {
    event.stopPropagation();
    mutation.mutate(packageItem.id);
    toast.success(`${packageItem.title} deleted successfully!`);
  };

  if (user?.role !== 'CREATOR') {
    return (
      <div className='myPackages'>
        <div className="container">
          <div className="title">
            <h1>My Packages</h1>
          </div>
          <p>Only creator accounts can manage packages.</p>
        </div>
      </div>
    );
  }

  const packageRows = data.map((packageItem) => {
    const imageSrc = packageItem.cover_image || packageItem.cover || '/media/noavatar.png';
    const statusLabel = packageItem.is_active ? 'Active' : 'Inactive';

    return (
      <tr key={packageItem.id}>
        <td>
          <Link to={`/package/${packageItem.id}`} className="table-link image-link" aria-label={`Open ${packageItem.title}`}>
            <img
              className="cover"
              src={imageSrc}
              alt={packageItem.title}
            />
          </Link>
        </td>
        <td>
          <Link to={`/package/${packageItem.id}`} className="table-link title-link">
            {packageItem.title}
          </Link>
        </td>
        <td>{formatPlatform(packageItem.platform)}</td>
        <td>{formatPrice(packageItem.price, packageItem.currency)}</td>
        <td>{statusLabel}</td>
        <td>
          <button
            type="button"
            className='delete-btn'
            aria-label={`Delete ${packageItem.title}`}
            onClick={(event) => handlePackageDelete(packageItem, event)}
          >
            <img
              className='delete'
              src="./media/delete.png"
              alt="Delete package"
            />
          </button>
        </td>
      </tr>
    );
  });

  let content = <div className='loader'> <Loader size={35} /> </div>;

  if (error) {
    content = 'Something went wrong';
  }

  if (!isLoading && !error) {
    content = (
      <div className="container">
        <div className="title">
          <h1>My Packages</h1>
          <Link to='/packages/new' className='link'>
            <button>Add New Package</button>
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Platform</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {packageRows}
          </tbody>
        </table>
        {!data.length && <p className="empty-state">You have not published any packages yet.</p>}
      </div>
    );
  }

  return (
    <div className='myPackages'>
      {content}
    </div>
  );
};

export default MyPackages;

