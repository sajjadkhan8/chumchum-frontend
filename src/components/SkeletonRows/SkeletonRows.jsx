import PropTypes from "prop-types";
import "./SkeletonRows.scss";

const SkeletonRows = ({ count }) => {
  return (
    <div className="skeletonRows" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeletonRows__item" key={index} />
      ))}
    </div>
  );
};

SkeletonRows.propTypes = {
  count: PropTypes.number,
};

SkeletonRows.defaultProps = {
  count: 5,
};

export default SkeletonRows;

