import { useEffect } from "react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  createConversation,
  getApiErrorMessage,
  getConversationByParticipants,
  getOrders,
  isNotFoundError,
} from "../../api";
import { useRecoilValue } from "recoil";
import { userState } from "../../atoms";
import { Loader } from '../../components';
import "./Orders.scss";

const Orders = () => {
  const navigate = useNavigate();
  const user = useRecoilValue(userState);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { isLoading, error, data = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });

  const isCreator = user?.role === "CREATOR";

  const handleContact = async (order) => {
    const sellerId = order.creatorId;
    const buyerId = order.brandId;

    if (!sellerId || !buyerId) {
      toast.error("Unable to start chat for this order.");
      return;
    }

    getConversationByParticipants({ sellerId, buyerId })
      .then((data) => {
        navigate(`/message/${data.conversationID || data.id || data._id}`);
      })
      .catch(async (error) => {
        if (isNotFoundError(error)) {
          const data = await createConversation({
            to: isCreator ? buyerId : sellerId,
            from: isCreator ? sellerId : buyerId,
          });
          navigate(`/message/${data.conversationID || data.id || data._id}`);
          return;
        }

        toast.error(getApiErrorMessage(error));
      });
  };

  return (
    <div className="orders">
      {isLoading ? (
        <div className="loader"> <Loader /> </div>
      ) : error ? (
        "Something went wrong!"
      ) : (
        <div className="container">
          <div className="title">
            <h1>Orders</h1>
          </div>
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>{isCreator ? "Brand" : "Creator"}</th>
                <th>Title</th>
                <th>Price</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr key={order.id}>
                  <td>
                    <img className="img" src={order.packageImage || "/media/noavatar.png"} alt={order.packageTitle} />
                  </td>
                  <td>{isCreator ? order.brandName : order.creatorName}</td>
                  <td>{(order.packageTitle || "Package").slice(0, 32)}</td>
                  <td>
                    {Number(order.price || 0).toLocaleString("en-PK", {
                      maximumFractionDigits: 0,
                      style: "currency",
                      currency: order.currency || "PKR",
                    })}
                  </td>
                  <td>
                    <img
                      className="message"
                      src="./media/message.png"
                      alt="message"
                      onClick={() => handleContact(order)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
