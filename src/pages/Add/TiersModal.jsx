import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

const formatLabel = (value) =>
  value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const TiersModal = ({ tiers, dispatch, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleTierChange = (index, event) => {
    const { name, value } = event.target;
    dispatch({ type: "UPDATE_TIER", payload: { index, name, value } });
  };

  const handleTierDeliverableSubmit = (index, event) => {
    event.preventDefault();
    const deliverable = event.target.elements[`tier-deliverable-${index}`]?.value.trim();
    if (!deliverable) return;

    if (tiers[index].deliverables.includes(deliverable)) {
      toast.error("This tier deliverable has already been added.");
      return;
    }

    dispatch({ type: "ADD_TIER_DELIVERABLE", payload: { index, value: deliverable } });
    event.target.reset();
  };

  return createPortal(
    <div
      className="tiers-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="tiers-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tiers-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tiers-modal__header">
          <div className="tiers-modal__header-text">
            <h2 id="tiers-modal-title">Package Tiers</h2>
            <p>Configure Basic, Standard, and Premium pricing variants.</p>
          </div>
          <button
            type="button"
            className="tiers-modal__close"
            onClick={onClose}
            aria-label="Close tiers modal"
          >
            ✕
          </button>
        </div>

        <div className="tiers-modal__body">
          <div className="tier-grid">
            {tiers.map((tier, index) => (
              <div key={tier.name} className="tier-card">
                <h4>{formatLabel(tier.name)}</h4>

                <label htmlFor={`modal-tier-price-${index}`}>Price</label>
                <input
                  id={`modal-tier-price-${index}`}
                  type="number"
                  min="0"
                  name="price"
                  value={tier.price}
                  onChange={(event) => handleTierChange(index, event)}
                />

                <label htmlFor={`modal-tier-delivery-days-${index}`}>Delivery Days</label>
                <input
                  id={`modal-tier-delivery-days-${index}`}
                  type="number"
                  min="1"
                  name="delivery_days"
                  value={tier.delivery_days}
                  onChange={(event) => handleTierChange(index, event)}
                />

                <label htmlFor={`modal-tier-revisions-${index}`}>Revisions</label>
                <input
                  id={`modal-tier-revisions-${index}`}
                  type="number"
                  min="1"
                  name="revisions"
                  value={tier.revisions}
                  onChange={(event) => handleTierChange(index, event)}
                />

                <label htmlFor={`modal-tier-deliverable-${index}`}>Tier Deliverables</label>
                <form
                  className="add tier-form"
                  onSubmit={(event) => handleTierDeliverableSubmit(index, event)}
                >
                  <input
                    id={`modal-tier-deliverable-${index}`}
                    type="text"
                    name={`tier-deliverable-${index}`}
                    placeholder="e.g. 1 reel + usage rights"
                  />
                  <button type="submit">Add</button>
                </form>

                <div className="addedFeatures compact">
                  {tier.deliverables.map((item) => (
                    <div key={`${tier.name}-${item}`} className="item">
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "REMOVE_TIER_DELIVERABLE",
                            payload: { index, value: item },
                          })
                        }
                      >
                        {item}
                        <span>X</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tiers-modal__footer">
          <button type="button" className="tiers-modal__done" onClick={onClose}>
            Save Tiers
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TiersModal;

