import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import moment from "moment";
import "./MessageList.scss";

const MessageList = ({ items }) => {
  return (
    <div className="messageList">
      {items.length ? (
        items.map((item) => (
          <Link className="messageList__item link" to={`/message/${item.conversationID}`} key={item.conversationID}>
            <div>
              <h4>{item.counterparty}</h4>
              <p>{item.lastMessage || "Start your first message."}</p>
            </div>
            <span>{item.updatedAt ? moment(item.updatedAt).fromNow() : "now"}</span>
          </Link>
        ))
      ) : (
        <p className="messageList__empty">No conversations yet.</p>
      )}
    </div>
  );
};

MessageList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      conversationID: PropTypes.string.isRequired,
      counterparty: PropTypes.string,
      lastMessage: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ).isRequired,
};

export default MessageList;

