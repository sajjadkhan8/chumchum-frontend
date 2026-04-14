import PropTypes from "prop-types";
import "./StatCard.scss";

const StatCard = ({ label, value, helper }) => {
  return (
    <article className="statCard">
      <p className="statCard__label">{label}</p>
      <h3 className="statCard__value">{value}</h3>
      {helper ? <p className="statCard__helper">{helper}</p> : null}
    </article>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
};

StatCard.defaultProps = {
  helper: "",
};

export default StatCard;

