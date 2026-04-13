import toast from 'react-hot-toast';
import { useEffect, useReducer, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { packageReducer, initialPackageState } from '../../reducers/packageReducer';
import { cards } from '../../data';
import { createPackage, getApiErrorMessage, getCreatorProfile, uploadImage } from '../../api';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';
import './Add.scss';

const PLATFORM_OPTIONS = [
  'INSTAGRAM',
  'TIKTOK',
  'YOUTUBE',
  'FACEBOOK',
  'SNAPCHAT',
  'LINKEDIN',
  'MULTI_PLATFORM',
];

const PACKAGE_TYPES = ['ONE_TIME', 'SUBSCRIPTION'];
const PRICING_TYPES = ['PAID', 'BARTER'];
const CURRENCY_OPTIONS = ['PKR', 'USD'];

const formatLabel = (value) =>
  value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const Add = () => {
  const user = useRecoilValue(userState);
  const [state, dispatch] = useReducer(packageReducer, initialPackageState);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorLoading, setCreatorLoading] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [packageImages, setPackageImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [assetsUploaded, setAssetsUploaded] = useState(false);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchCreator = async () => {
      if (!user?.id || user?.role !== 'CREATOR') {
        setCreatorLoading(false);
        return;
      }

      try {
        const creator = await getCreatorProfile(user.id);
        setCreatorProfile(creator);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setCreatorLoading(false);
      }
    };

    fetchCreator();
  }, [user]);

  const mutation = useMutation({
    mutationFn: (packagePayload) => createPackage(packagePayload),
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['my-packages'] });
    },
  });

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    dispatch({
      type: 'CHANGE_INPUT',
      payload: { name, value },
    });
  };

  const handleDeliverableSubmit = (event) => {
    event.preventDefault();

    const deliverable = deliverableInput.trim();
    if (!deliverable) return;

    if (state.deliverables.includes(deliverable)) {
      toast.error('This deliverable has already been added.');
      return;
    }

    dispatch({
      type: 'ADD_DELIVERABLE',
      payload: deliverable,
    });
    setDeliverableInput('');
  };

  const handleTagSubmit = (event) => {
    event.preventDefault();

    const tag = tagInput.trim();
    if (!tag) return;

    if (state.tags.includes(tag)) {
      toast.error('This tag has already been added.');
      return;
    }

    dispatch({
      type: 'ADD_TAG',
      payload: tag,
    });
    setTagInput('');
  };

  const handleTierChange = (index, event) => {
    const { name, value } = event.target;
    dispatch({
      type: 'UPDATE_TIER',
      payload: { index, name, value },
    });
  };

  const handleTierDeliverableSubmit = (index, event) => {
    event.preventDefault();
    const deliverable = event.target.elements[`tier-deliverable-${index}`]?.value.trim();

    if (!deliverable) return;

    if (state.tiers[index].deliverables.includes(deliverable)) {
      toast.error('This tier deliverable has already been added.');
      return;
    }

    dispatch({
      type: 'ADD_TIER_DELIVERABLE',
      payload: { index, value: deliverable },
    });
    event.target.reset();
  };

  const uploadSelectedMedia = async () => {
    if (!coverImage && !packageImages.length) {
      return {
        cover_image: state.cover_image,
        media_urls: state.media_urls,
      };
    }

    setUploading(true);

    try {
      const coverUpload = coverImage ? await uploadImage(coverImage) : null;
      const galleryUploads = packageImages.length
        ? await Promise.all([...packageImages].map((imageFile) => uploadImage(imageFile)))
        : [];

      const payload = {
        cover_image: coverUpload?.url || state.cover_image,
        media_urls: galleryUploads.map((imageFile) => imageFile.url).filter(Boolean),
      };

      dispatch({
        type: 'ADD_MEDIA',
        payload,
      });
      setAssetsUploaded(true);
      return payload;
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (user?.role !== 'CREATOR') {
      toast.error('Only creators can publish packages.');
      return false;
    }

    if (!creatorProfile?.id) {
      toast.error('Your creator profile is required before publishing a package.');
      return false;
    }

    const requiredFields = [
      ['title', state.title],
      ['description', state.description],
      ['platform', state.platform],
      ['category', state.category],
      ['type', state.type],
      ['pricing type', state.pricing_type],
      ['price', state.price],
      ['delivery days', state.delivery_days],
    ];

    const missingField = requiredFields.find(([, value]) => value === '' || value === null || value === undefined);
    if (missingField) {
      toast.error(`Please fill in ${missingField[0]}.`);
      return false;
    }

    if (state.deliverables.length === 0) {
      toast.error('Please add at least one deliverable.');
      return false;
    }

    if (!coverImage && !state.cover_image) {
      toast.error('Please upload a package cover image.');
      return false;
    }

    if (state.pricing_type === 'BARTER' && !state.barter_details.trim()) {
      toast.error('Please describe the barter offer details.');
      return false;
    }

    return true;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const uploadedAssets = assetsUploaded
        ? { cover_image: state.cover_image, media_urls: state.media_urls }
        : await uploadSelectedMedia();

      await mutation.mutateAsync({
        ...state,
        creator_id: creatorProfile.id,
        cover_image: uploadedAssets.cover_image,
        media_urls: uploadedAssets.media_urls,
      });

      toast.success('Your package is now live on ChumChum!');
      navigate('/my-packages');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (creatorLoading) {
    return (
      <div className='add'>
        <div className="container">
          <h1>Create a New Package</h1>
          <p>Loading your creator workspace...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'CREATOR') {
    return (
      <div className='add'>
        <div className="container">
          <h1>Create a New Package</h1>
          <p>Only creator accounts can publish packages. Switch to a creator account to continue.</p>
        </div>
      </div>
    );
  }

  let uploadButtonLabel = 'Upload';
  if (uploading) {
    uploadButtonLabel = 'Uploading...';
  } else if (assetsUploaded) {
    uploadButtonLabel = 'Uploaded';
  }

  return (
    <div className='add'>
      <div className="container">
        <h1>Create a New Package</h1>
        <div className="sections">
          <div className="left">
            <label htmlFor="package-title">Title</label>
            <input
              id="package-title"
              name='title'
              type="text"
              placeholder="e.g. Instagram reel package for fashion brands"
              value={state.title}
              onChange={handleFormChange}
            />

            <label htmlFor="package-platform">Platform</label>
            <select id="package-platform" name="platform" value={state.platform} onChange={handleFormChange}>
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform} value={platform}>{formatLabel(platform)}</option>
              ))}
            </select>

            <label htmlFor="package-category">Category</label>
            <select id="package-category" name="category" value={state.category} onChange={handleFormChange}>
              <option value=''>Category</option>
              {cards.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>

            <div className="images">
              <div className="imagesInputs">
                <label htmlFor="package-cover-image">Cover Image</label>
                <input
                  id="package-cover-image"
                  type="file"
                  accept='image/*'
                  onChange={(event) => {
                    setCoverImage(event.target.files[0]);
                    setAssetsUploaded(false);
                  }}
                />
                <br />
                <label htmlFor="package-gallery-media">Gallery Media</label>
                <input
                  id="package-gallery-media"
                  type="file"
                  accept='image/*'
                  multiple
                  onChange={(event) => {
                    setPackageImages(event.target.files);
                    setAssetsUploaded(false);
                  }}
                />
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={async () => {
                  try {
                    await uploadSelectedMedia();
                    toast.success('Package media uploaded successfully.');
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                {uploadButtonLabel}
              </button>
            </div>

            <label htmlFor="package-description">Description</label>
            <textarea
              id="package-description"
              name='description'
              cols="30"
              rows="16"
              placeholder='Describe the package experience, content style, target audience, and what collaborators can expect.'
              value={state.description}
              onChange={handleFormChange}
            ></textarea>

            <label htmlFor="package-deliverable-input">Deliverables</label>
            <form className='add' onSubmit={handleDeliverableSubmit}>
              <input
                id="package-deliverable-input"
                type="text"
                placeholder='e.g. 1 Instagram Reel + 3 story frames'
                value={deliverableInput}
                onChange={(event) => setDeliverableInput(event.target.value)}
              />
              <button type='submit'>Add</button>
            </form>
            <div className="addedFeatures">
              {state.deliverables.map((deliverable) => (
                <div key={deliverable} className="item">
                  <button type="button" onClick={() => dispatch({ type: 'REMOVE_DELIVERABLE', payload: deliverable })}>
                    {deliverable}
                    <span>X</span>
                  </button>
                </div>
              ))}
            </div>

            <label htmlFor="package-tag-input">Tags</label>
            <form className='add' onSubmit={handleTagSubmit}>
              <input
                id="package-tag-input"
                type="text"
                placeholder='e.g. fashion, beauty, lifestyle'
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
              />
              <button type='submit'>Add</button>
            </form>
            <div className="addedFeatures tags-list">
              {state.tags.map((tag) => (
                <div key={tag} className="item">
                  <button type="button" onClick={() => dispatch({ type: 'REMOVE_TAG', payload: tag })}>
                    {tag}
                    <span>X</span>
                  </button>
                </div>
              ))}
            </div>

            <button disabled={mutation.isPending || uploading} onClick={handleFormSubmit}>
              {mutation.isPending ? 'Publishing...' : 'Create Package'}
            </button>
          </div>

          <div className="right">
            <label htmlFor="package-type">Package Type</label>
            <select id="package-type" name='type' value={state.type} onChange={handleFormChange}>
              {PACKAGE_TYPES.map((type) => (
                <option key={type} value={type}>{formatLabel(type)}</option>
              ))}
            </select>

            <label htmlFor="package-pricing-type">Pricing Type</label>
            <select id="package-pricing-type" name='pricing_type' value={state.pricing_type} onChange={handleFormChange}>
              {PRICING_TYPES.map((pricingType) => (
                <option key={pricingType} value={pricingType}>{formatLabel(pricingType)}</option>
              ))}
            </select>

            {state.pricing_type === 'BARTER' && (
              <>
                <label htmlFor="package-barter-details">Barter Details</label>
                <textarea
                  id="package-barter-details"
                  name='barter_details'
                  cols="30"
                  rows="5"
                  placeholder='e.g. Complimentary weekend stay + travel allowance worth PKR 50,000'
                  value={state.barter_details}
                  onChange={handleFormChange}
                ></textarea>
              </>
            )}

            <label htmlFor="package-base-price">Base Price</label>
            <input id="package-base-price" name='price' type="number" min='0' value={state.price} onChange={handleFormChange} />

            <label htmlFor="package-currency">Currency</label>
            <select id="package-currency" name='currency' value={state.currency} onChange={handleFormChange}>
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>

            <label htmlFor="package-delivery-days">Delivery Days</label>
            <input id="package-delivery-days" type="number" name='delivery_days' min='1' value={state.delivery_days} onChange={handleFormChange} />

            <label htmlFor="package-duration-days">Duration Days</label>
            <input
              id="package-duration-days"
              type="number"
              name='duration_days'
              min='1'
              placeholder='Optional for subscriptions or campaign duration'
              value={state.duration_days}
              onChange={handleFormChange}
            />

            <label htmlFor="package-revisions">Revisions</label>
            <input id="package-revisions" type="number" name='revisions' min='1' value={state.revisions} onChange={handleFormChange} />

            <div className="tier-section">
              <div className="tier-header">
                <h3>Optional Package Tiers</h3>
                <p>Add Basic, Standard, and Premium variants for more flexible pricing.</p>
              </div>

              <div className="tier-grid">
                {state.tiers.map((tier, index) => (
                  <div key={tier.name} className="tier-card">
                    <h4>{formatLabel(tier.name)}</h4>

                    <label htmlFor={`tier-price-${index}`}>Price</label>
                    <input
                      id={`tier-price-${index}`}
                      type="number"
                      min='0'
                      name='price'
                      value={tier.price}
                      onChange={(event) => handleTierChange(index, event)}
                    />

                    <label htmlFor={`tier-delivery-days-${index}`}>Delivery Days</label>
                    <input
                      id={`tier-delivery-days-${index}`}
                      type="number"
                      min='1'
                      name='delivery_days'
                      value={tier.delivery_days}
                      onChange={(event) => handleTierChange(index, event)}
                    />

                    <label htmlFor={`tier-revisions-${index}`}>Revisions</label>
                    <input
                      id={`tier-revisions-${index}`}
                      type="number"
                      min='1'
                      name='revisions'
                      value={tier.revisions}
                      onChange={(event) => handleTierChange(index, event)}
                    />

                    <label htmlFor={`tier-deliverable-${index}`}>Tier Deliverables</label>
                    <form className='add tier-form' onSubmit={(event) => handleTierDeliverableSubmit(index, event)}>
                      <input id={`tier-deliverable-${index}`} type="text" name={`tier-deliverable-${index}`} placeholder='e.g. 1 reel + usage rights' />
                      <button type='submit'>Add</button>
                    </form>

                    <div className="addedFeatures compact">
                      {tier.deliverables.map((item) => (
                        <div key={`${tier.name}-${item}`} className="item">
                          <button
                            type="button"
                            onClick={() => dispatch({
                              type: 'REMOVE_TIER_DELIVERABLE',
                              payload: { index, value: item },
                            })}
                          >
                            {item}
                            <span>X</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Add;

