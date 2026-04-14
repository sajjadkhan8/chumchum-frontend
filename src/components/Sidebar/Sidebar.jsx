import PropTypes from "prop-types";
import "./Sidebar.scss";

const Sidebar = ({ title, items, activeKey, onSelect }) => {
  return (
    <aside className="dashboardSidebar">
      <div className="dashboardSidebar__title">{title}</div>
      <nav className="dashboardSidebar__menu" aria-label={`${title} navigation`}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`dashboardSidebar__item ${activeKey === item.key ? "active" : ""}`}
            onClick={() => onSelect(item.key)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default Sidebar;

