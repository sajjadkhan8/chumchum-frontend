import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { createPaymentIntent, getApiErrorMessage } from '../../api';
import { CheckoutForm } from '../../components';
import './Pay.scss';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Pay = () => {
  const { _id } = useParams();
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    ( async () => {
      try {
        const data = await createPaymentIntent(_id);
        setClientSecret(data.clientSecret);
      }
      catch(error) {
        console.log(getApiErrorMessage(error));
      }
    })();
    window.scrollTo(0, 0)
  }, []);

  const appearance = {
    theme: 'stripe',
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className='pay'>
      <h2>Pay Securely with Stripe</h2>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  )
}

export default Pay