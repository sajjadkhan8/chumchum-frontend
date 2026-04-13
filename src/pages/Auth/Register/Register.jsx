import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, registerUser, uploadImage, createCreatorProfile, createBrandProfile } from '../../../api';
import { pakistanCities } from '../../../utils';
import './Register.scss'

const Register = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(''); // 'CREATOR' or 'BRAND'
  const [formInput, setFormInput] = useState({
    username: "",
    email: "",
    password: "",
    city: '',
    phone: '',
  });

  // Creator specific fields
  const [creatorData, setCreatorData] = useState({
    bio: '',
    category: '',
    tiktok_url: '',
    instagram_url: '',
    youtube_url: '',
  });

  // Brand specific fields
  const [brandData, setBrandData] = useState({
    company_name: '',
    website: '',
    industry: '',
    description: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Basic validation
    for (let key in formInput) {
      if (formInput[key] === '') {
        toast.error('Please fill all required fields: ' + key);
        return;
      }
    }

    if (!role) {
      toast.error('Please select a role (Creator or Brand)');
      return;
    }

    if (formInput.phone.length < 9) {
      toast.error('Enter a valid phone number!');
      return;
    }

    // Role-specific validation
    if (role === 'CREATOR') {
      if (!creatorData.bio || !creatorData.category) {
        toast.error('Please fill all Creator fields');
        return;
      }
    } else if (role === 'BRAND') {
      if (!brandData.company_name) {
        toast.error('Please fill all Brand fields');
        return;
      }
    }

    setLoading(true);
    try {
      const uploadedImage = await uploadImage(image);

      // Register user
      const userData = {
        ...formInput,
        role: role,
        image: uploadedImage?.url || '',
      };

      const registeredUser = await registerUser(userData);

      // Create role-specific profile
      if (role === 'CREATOR') {
        await createCreatorProfile({
          user_id: registeredUser.user.id,
          ...creatorData,
        });
      } else if (role === 'BRAND') {
        await createBrandProfile({
          user_id: registeredUser.user.id,
          ...brandData,
        });
      }

      toast.success('Registration successful!');
      setLoading(false);
      navigate('/login');
    }
    catch (error) {
      toast.error(getApiErrorMessage(error));
      setLoading(false);
    }
  }

  const handleChange = (event) => {
    const { value, name } = event.target;
    setFormInput({
      ...formInput,
      [name]: value
    });
  }

  const handleCreatorChange = (event) => {
    const { value, name } = event.target;
    setCreatorData({
      ...creatorData,
      [name]: value
    });
  }

  const handleBrandChange = (event) => {
    const { value, name } = event.target;
    setBrandData({
      ...brandData,
      [name]: value
    });
  }

  return (
    <div className="register">
      <form onSubmit={handleSubmit}>
        <div className="left">
          <h1>Create a new account</h1>

          <label htmlFor="">Role</label>
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${role === 'CREATOR' ? 'active' : ''}`}
              onClick={() => setRole('CREATOR')}
            >
              Creator
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'BRAND' ? 'active' : ''}`}
              onClick={() => setRole('BRAND')}
            >
              Brand
            </button>
          </div>

          <label htmlFor="">Username</label>
          <input
            name="username"
            type="text"
            placeholder="johndoe"
            onChange={handleChange}
          />
          <label htmlFor="">Email</label>
          <input
            name="email"
            type="email"
            placeholder="email@example.com"
            onChange={handleChange}
          />
          <label htmlFor="">Password</label>
          <input name="password" type="password" placeholder="Enter password" onChange={handleChange} />
          <label htmlFor="">Profile Picture</label>
          <input type="file" onChange={(event) => setImage(event.target.files[0])} />
          <label htmlFor="">Phone Number</label>
          <input
            name="phone"
            type="text"
            placeholder="+92 300 1234567"
            onChange={handleChange}
          />
          <label htmlFor="city">City</label>
          <select name="city" id="city" value={formInput.city} onChange={handleChange}>
            <option value="">Select your city</option>
            {pakistanCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="right">
          <p>Already have an account? <Link to='/login'>Sign in</Link></p>

          {role === 'CREATOR' && (
            <div className="role-specific">
              <h2>Creator Information</h2>
              <label htmlFor="">Bio</label>
              <textarea
                placeholder="Tell us about yourself"
                name="bio"
                rows="4"
                value={creatorData.bio}
                onChange={handleCreatorChange}
              ></textarea>

              <label htmlFor="">Category</label>
              <input
                name="category"
                type="text"
                placeholder="e.g., Fashion, Gaming, Fitness"
                value={creatorData.category}
                onChange={handleCreatorChange}
              />

              <label htmlFor="">TikTok URL</label>
              <input
                name="tiktok_url"
                type="url"
                placeholder="https://tiktok.com/@yourprofile"
                value={creatorData.tiktok_url}
                onChange={handleCreatorChange}
              />

              <label htmlFor="">Instagram URL</label>
              <input
                name="instagram_url"
                type="url"
                placeholder="https://instagram.com/yourprofile"
                value={creatorData.instagram_url}
                onChange={handleCreatorChange}
              />

              <label htmlFor="">YouTube URL</label>
              <input
                name="youtube_url"
                type="url"
                placeholder="https://youtube.com/@yourprofile"
                value={creatorData.youtube_url}
                onChange={handleCreatorChange}
              />
            </div>
          )}

          {role === 'BRAND' && (
            <div className="role-specific">
              <h2>Brand Information</h2>
              <label htmlFor="">Company Name</label>
              <input
                name="company_name"
                type="text"
                placeholder="Your company name"
                value={brandData.company_name}
                onChange={handleBrandChange}
              />

              <label htmlFor="">Website</label>
              <input
                name="website"
                type="url"
                placeholder="https://yourcompany.com"
                value={brandData.website}
                onChange={handleBrandChange}
              />

              <label htmlFor="">Industry</label>
              <input
                name="industry"
                type="text"
                placeholder="e.g., Fashion, Tech, E-commerce"
                value={brandData.industry}
                onChange={handleBrandChange}
              />

              <label htmlFor="">Description</label>
              <textarea
                placeholder="Tell us about your brand"
                name="description"
                rows="4"
                value={brandData.description}
                onChange={handleBrandChange}
              ></textarea>
            </div>
          )}

          <button type="submit" disabled={loading || !role} className="register-btn">
            {loading ? 'Loading...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Register