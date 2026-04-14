import toast from 'react-hot-toast';
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRecoilValue } from "recoil";
import { userState } from "../../atoms";
import { getApiErrorMessage, getMessages, sendMessage } from '../../api';
import { Loader } from '../../components';
import "./Message.scss";

const Message = () => {
  const user = useRecoilValue(userState);
  const { conversationID } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  const { isLoading, error, data = [] } = useQuery({
    queryKey: ['messages', conversationID],
    queryFn: () => getMessages(conversationID),
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  });
  
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (message) => sendMessage(message),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['messages', conversationID] })
  })

  const handleMessageSubmit = (event) => {
    event.preventDefault();
    
    mutation.mutate({
      conversationID,
      description: event.target[0].value
    });

    event.target.reset();
  }

  let content = <div className="loader"> <Loader /> </div>;

  if (error) {
    content = 'Something went wrong';
  }

  if (!isLoading && !error) {
    content = (
      <div className="messages">
        {
          data.map((message) => (
            <div
              className={
                (message.userID?.id || message.userID?._id) === (user?.id || user?._id)
                  ? 'owner item'
                  : 'item'
              }
              key={message._id || message.id}
            >
              <img
                src={message.userID?.image || '/media/noavatar.png'}
                alt=""
              />
              <p>
                {message.description}
              </p>
            </div>
          ))
        }
      </div>
    );
  }

  return (
    <div className="message">
      <div className="container">
        <span className="breadcrumbs">
          <Link to="/messages" className="link">Messages</Link>
        </span>
        {content}
        <hr />
        <form className="write" onSubmit={handleMessageSubmit}>
          <textarea cols="30" rows="10" placeholder="Write a message"></textarea>
          <button type='submit'>Send</button>
        </form>
      </div>
    </div>
  );
};

export default Message;