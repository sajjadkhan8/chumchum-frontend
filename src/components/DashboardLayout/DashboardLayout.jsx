import PropTypes from "prop-types";
import Sidebar from "../Sidebar/Sidebar";
import "./DashboardLayout.scss";

const DashboardLayout = ({ title, subtitle, sidebarItems, activeKey, onSelect, children }) => {
  return (
    <section className="dashboardLayout">
      <div className="dashboardLayout__container">
        <header className="dashboardLayout__header">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>

        <div className="dashboardLayout__content">
          <Sidebar title={title} items={sidebarItems} activeKey={activeKey} onSelect={onSelect} />
          <div className="dashboardLayout__main">{children}</div>
        </div>
      </div>
    </section>
  );
};

DashboardLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  sidebarItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

DashboardLayout.defaultProps = {
  subtitle: "",
};

export default DashboardLayout;

