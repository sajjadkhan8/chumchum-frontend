export const initialPackageState = {
  creator_id: "",
  title: "",
  description: "",
  platform: "INSTAGRAM",
  category: "",
  type: "ONE_TIME",
  pricing_type: "PAID",
  barter_details: "",
  price: "",
  currency: "PKR",
  deliverables: [],
  delivery_days: "",
  duration_days: "",
  revisions: 1,
  cover_image: "",
  media_urls: [],
  tags: [],
  is_active: true,
  is_featured: false,
  tiers: [
    { name: "BASIC", price: "", deliverables: [], delivery_days: "", revisions: 1 },
    { name: "STANDARD", price: "", deliverables: [], delivery_days: "", revisions: 1 },
    { name: "PREMIUM", price: "", deliverables: [], delivery_days: "", revisions: 1 },
  ],
};

export const packageReducer = (state, { type, payload }) => {
  switch (type) {
    case "CHANGE_INPUT":
      return {
        ...state,
        [payload.name]: payload.value,
      };

    case "ADD_MEDIA":
      return {
        ...state,
        cover_image: payload.cover_image,
        media_urls: payload.media_urls,
      };

    case "ADD_DELIVERABLE":
      return {
        ...state,
        deliverables: [...state.deliverables, payload],
      };

    case "REMOVE_DELIVERABLE":
      return {
        ...state,
        deliverables: state.deliverables.filter((deliverable) => deliverable !== payload),
      };

    case "ADD_TAG":
      return {
        ...state,
        tags: [...state.tags, payload],
      };

    case "REMOVE_TAG":
      return {
        ...state,
        tags: state.tags.filter((tag) => tag !== payload),
      };

    case "UPDATE_TIER":
      return {
        ...state,
        tiers: state.tiers.map((tier, index) =>
          index === payload.index
            ? {
                ...tier,
                [payload.name]: payload.value,
              }
            : tier
        ),
      };

    case "ADD_TIER_DELIVERABLE":
      return {
        ...state,
        tiers: state.tiers.map((tier, index) =>
          index === payload.index
            ? {
                ...tier,
                deliverables: [...tier.deliverables, payload.value],
              }
            : tier
        ),
      };

    case "REMOVE_TIER_DELIVERABLE":
      return {
        ...state,
        tiers: state.tiers.map((tier, index) =>
          index === payload.index
            ? {
                ...tier,
                deliverables: tier.deliverables.filter((item) => item !== payload.value),
              }
            : tier
        ),
      };

    default:
      return state;
  }
};

