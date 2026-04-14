import PropTypes from "prop-types";
import "./Table.scss";

const Table = ({ columns, rows, emptyText }) => {
  return (
    <div className="dashboardTable">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.key}>
                {columns.map((column) => (
                  <td key={`${row.key}-${column.key}`}>{row[column.key]}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="dashboardTable__empty">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  emptyText: PropTypes.string,
};

Table.defaultProps = {
  emptyText: "No records found.",
};

export default Table;

