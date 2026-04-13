import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmOrderPayment, getApiErrorMessage } from "../../api";
import "./Success.scss";

const Success = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const payment_intent = params.get("payment_intent");

  useEffect(() => {
    (async () => {
      try {
        await confirmOrderPayment(payment_intent);
        setTimeout(() => {
          navigate("/orders");
        }, 5000);
      } catch (error) {
        console.log(getApiErrorMessage(error));
      }
    })();
  }, []);

  return (
    <div className="pay-message">
      Payment successful. You are being redirected to the orders page. Please do
      not close the page
    </div>
  );
};

export default Success;
