import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, loginUser, persistAuthSession } from '../../../api';
import { useRecoilState } from 'recoil';
import { userState } from '../../../atoms';
import { getDashboardPathByRole } from '../../../api/session';
import './Login.scss';

const initialState = {
  username: '',
  password: ''
}

const Login = () => {
  const [formInput, setFormInput] = useState(initialState);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [, setUser] = useRecoilState(userState);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleFormInput = (event) => {
    const { value, name } = event.target;
    setFormInput({
      ...formInput,
      [name]: value
    });
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    for(let key in formInput) {
      if(formInput[key] === '') {
        toast.error('Please fill all input fields: ' + key);
        return;
      }
    }

    setLoading(true);
    try {
      const data = await loginUser(formInput);
      const { user } = persistAuthSession(data);

      if (!user?.id) {
        throw new Error('Login succeeded but user details are missing.');
      }

      setUser(user);
      toast.success("Welcome back!", {
        duration: 3000,
        icon: "😃"
      });
      navigate(getDashboardPathByRole(user.role));
    }
    catch (error) {
      const message = getApiErrorMessage(error);
      setError(message);
      toast.error(message, {
        duration: 3000,
      });
    }
    finally {
      setLoading(false);
      setError(null);
    }
  }

  return (
    <div className='login'>
      <form action="" onSubmit={handleFormSubmit}>
        <h1>Sign in</h1>
        <label htmlFor="login-username">Username</label>
        <input id='login-username' name='username' placeholder='johndoe' onChange={handleFormInput} />

        <label htmlFor="login-password">Password</label>
        <input id='login-password' name='password' type='password' placeholder='password' onChange={handleFormInput} />
        <button disabled={loading} type='submit'>{ loading ? 'Loading' : 'Login' }</button>
        <span>{error || ''}</span>
      </form>
    </div>
  )
}

export default Login