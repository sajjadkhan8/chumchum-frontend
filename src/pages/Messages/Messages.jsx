import moment from 'moment';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { getConversations, markConversationAsRead } from '../../api';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';
import { Loader } from '../../components';
import './Messages.scss';

const Messages = () => {
  const user = useRecoilValue(userState);
  const queryClient = useQueryClient();
  const isCreator = user?.role === 'CREATOR';

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { isLoading, error, data = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations()
  })

  const mutation = useMutation({
    mutationFn: (id) => markConversationAsRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
  })

  const handleMessageRead = (id) => {
    mutation.mutate(id);
  }

  let content = <div className='loader'> <Loader /> </div>;

  if (error) {
    content = 'Something went wrong!';
  }

  if (!isLoading && !error) {
    content = (
      <table>
        <thead>
          <tr>
            <th>{isCreator ? 'Brand' : 'Creator'}</th>
            <th>Last Message</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {
            data.map((conv) => (
              <tr key={conv._id || conv.id || conv.conversationID} className={((isCreator && !conv.readBySeller) || (!isCreator && !conv.readByBuyer)) &&
                "active" || ''}>
                <td>{isCreator ? conv.buyerID?.username : conv.sellerID?.username}</td>
                <td>
                  <Link className='link' to={`/message/${conv.conversationID || conv.id || conv._id}`}>
                    {conv?.lastMessage?.slice(0, 100)}...
                  </Link>
                </td>
                <td>{moment(conv.updatedAt).fromNow()}</td>
                <td>
                  {
                    ((isCreator && !conv.readBySeller) || (!isCreator && !conv.readByBuyer)) &&
                    (<button onClick={() => handleMessageRead(conv.conversationID || conv.id || conv._id)}>Mark as read</button>)
                  }
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    );
  }

  return (
    <div className='messages'>
      <div className="container">
        <div className="title">
          <h1>Messages</h1>
        </div>
        {content}
      </div>
    </div>
  )
}

export default Messages