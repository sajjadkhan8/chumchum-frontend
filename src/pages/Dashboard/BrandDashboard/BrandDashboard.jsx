import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userState } from "../../../atoms";
import { DashboardLayout, MessageList, SkeletonRows, StatCard, Table } from "../../../components";
import { useBrandProfile, useConversations, useCreators, useOrders } from "../../../hooks/useDashboardApi";
import useDashboardTab from "../../../hooks/useDashboardTab";
import { SUPPORTED_PLATFORM_META } from "../../../utils/platforms";
import "../dashboardPages.scss";

const PAGE_SIZE = 9;

const FOLLOWERS_TIERS = [
  { key: "", label: "Any Size" },
  { key: "nano", label: "Nano (<10K)", min: 0, max: 9999 },
  { key: "micro", label: "Micro (10K–100K)", min: 10000, max: 99999 },
  { key: "macro", label: "Macro (100K–1M)", min: 100000, max: 999999 },
  { key: "mega", label: "Mega (1M+)", min: 1000000, max: Infinity },
];

const SORT_OPTIONS = [
  { key: "top_rated", label: "Top Rated" },
  { key: "most_followers", label: "Most Followers" },
  { key: "most_reviewed", label: "Most Reviewed" },
];

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));

const getCreatorUserId = (creator) => {
  if (typeof creator.user === "object") return creator.user?.id || "";
  return creator.user || "";
};

const creatorHasPlatform = (creator, platformKey) => {
  const map = {
    YOUTUBE: creator.youtube_url,
    INSTAGRAM: creator.instagram_url,
    TIKTOK: creator.tiktok_url,
    FACEBOOK: creator.facebook_url,
  };
  return Boolean(map[platformKey]);
};

const BrandDashboard = () => {
  const user = useRecoilValue(userState);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [sortBy, setSortBy] = useState("top_rated");
  const [page, setPage] = useState(1);

  const { data: creators = [], isLoading: creatorsLoading } = useCreators();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const { data: brandProfile } = useBrandProfile(user?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset to page 1 on any filter/sort change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, platformFilter, tierFilter, sortBy]);

  const brandOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.brandId === user?.id ||
          (order.brandName || "").toLowerCase() === (user?.username || "").toLowerCase()
      ),
    [orders, user]
  );

  const creatorOptions = [...new Set(creators.map((item) => item.category).filter(Boolean))];

  const filteredCreators = useMemo(() => {
    const tier = FOLLOWERS_TIERS.find((t) => t.key === tierFilter);
    return creators
      .filter((c) => !categoryFilter || c.category === categoryFilter)
      .filter((c) => !platformFilter || creatorHasPlatform(c, platformFilter))
      .filter((c) => {
        if (!tier || !tier.key) return true;
        const f = Number(c.followers || 0);
        return f >= tier.min && f <= tier.max;
      })
      .sort((a, b) => {
        if (sortBy === "top_rated") return Number(b.rating || 0) - Number(a.rating || 0);
        if (sortBy === "most_followers") return Number(b.followers || 0) - Number(a.followers || 0);
        if (sortBy === "most_reviewed") return Number(b.total_reviews || 0) - Number(a.total_reviews || 0);
        return 0;
      });
  }, [creators, categoryFilter, platformFilter, tierFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCreators.length / PAGE_SIZE));
  const paginatedCreators = filteredCreators.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const orderRows = brandOrders.map((order) => ({
    key: order.id,
    creator: order.creatorName,
    package: order.packageTitle,
    pricing:
      order.pricing_type === "BARTER" ? (
        <span className="badge barter">🎁 Barter Deal</span>
      ) : (
        `💰 PKR ${Number(order.price || 0).toLocaleString("en-PK")}`
      ),
    status: order.status,
  }));

  const conversationItems = conversations.map((conversation) => ({
    conversationID: conversation.conversationID || conversation.id || conversation._id,
    counterparty: conversation.sellerID?.username || conversation.creator?.user?.username || "Creator",
    lastMessage: conversation.lastMessage,
    updatedAt: conversation.updatedAt || conversation.updated_at,
  }));

  const stats = [
    {
      label: "Active Collaborations",
      value: brandOrders.filter((item) => item.status === "ACTIVE").length,
      helper: "Currently running",
    },
    {
      label: "Total Spend",
      value: `PKR ${brandOrders.reduce((sum, item) => sum + Number(item.price || 0), 0).toLocaleString("en-PK")}`,
      helper: "Paid + pending",
    },
    {
      label: "Saved Creators",
      value: Math.min(filteredCreators.length, 12),
      helper: "Quick shortlist",
    },
    {
      label: "Recent Activity",
      value: brandOrders.slice(0, 5).length,
      helper: "Last 7 days",
    },
  ];

  const sidebarItems = [
    { key: "overview", label: "Dashboard" },
    { key: "explore", label: "Explore Creators" },
    { key: "orders", label: "My Orders" },
    { key: "messages", label: "Messages" },
    { key: "favorites", label: "Favorites" },
    { key: "settings", label: "Settings" },
  ];
  const { activeTab, setActiveTab } = useDashboardTab({
    validTabs: sidebarItems.map((item) => item.key),
    defaultTab: "overview",
  });

  return (
    <DashboardLayout
      title="Brand Dashboard"
      subtitle={`Welcome back, ${user?.username || "Brand"}`}
      sidebarItems={sidebarItems}
      activeKey={activeTab}
      onSelect={setActiveTab}
    >
      {activeTab === "overview" ? <div className="dashboardGrid">{stats.map((item) => <StatCard key={item.label} {...item} />)}</div> : null}

      {activeTab === "explore" ? (
        <div className="dashboardPanel explorePanel">
          {/* ── Filter bar ── */}
          <div className="exploreFilters">
            <div className="exploreFilters__row">
              {/* Category */}
              <div className="exploreFilters__group">
                <label className="exploreFilters__label">Category</label>
                <select
                  className="exploreFilters__select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {creatorOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="exploreFilters__group">
                <label className="exploreFilters__label">Sort By</label>
                <select
                  className="exploreFilters__select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Platform pills */}
            <div className="exploreFilters__group">
              <label className="exploreFilters__label">Platform</label>
              <div className="exploreFilters__pills">
                <button
                  type="button"
                  className={`filterPill ${platformFilter === "" ? "filterPill--active" : ""}`}
                  onClick={() => setPlatformFilter("")}
                >
                  All Platforms
                </button>
                {Object.entries(SUPPORTED_PLATFORM_META).map(([key, { label }]) => (
                  <button
                    key={key}
                    type="button"
                    className={`filterPill ${platformFilter === key ? "filterPill--active" : ""}`}
                    onClick={() => setPlatformFilter(platformFilter === key ? "" : key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Followers tier pills */}
            <div className="exploreFilters__group">
              <label className="exploreFilters__label">Creator Size</label>
              <div className="exploreFilters__pills">
                {FOLLOWERS_TIERS.map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    className={`filterPill ${tierFilter === tier.key ? "filterPill--active" : ""}`}
                    onClick={() => setTierFilter(tier.key)}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Result meta ── */}
          {!creatorsLoading && (
            <p className="exploreResultMeta">
              {filteredCreators.length === 0
                ? "No creators match your filters."
                : `${filteredCreators.length} creator${filteredCreators.length !== 1 ? "s" : ""} found · Page ${page} of ${totalPages}`}
            </p>
          )}

          {/* ── Cards ── */}
          {creatorsLoading ? <SkeletonRows count={9} /> : null}

          {!creatorsLoading && paginatedCreators.length > 0 ? (
            <div className="featuredCreatorGrid">
              {paginatedCreators.map((creator) => {
                const creatorUserId = getCreatorUserId(creator);
                const creatorImage = creator.user?.image || "/media/noavatar.png";
                const creatorName = creator.user?.username || "Creator";
                const creatorBio = (creator.bio || creator.user?.description || "").trim();
                const activePlatforms = Object.entries(SUPPORTED_PLATFORM_META)
                  .filter(([key]) => creatorHasPlatform(creator, key))
                  .map(([, { label }]) => label);

                return (
                  <article key={creator.id} className="featuredCreatorCard">
                    <div className="featuredCreatorCard__header">
                      <img src={creatorImage} alt={creatorName} />
                      <div>
                        <h3>{creatorName}</h3>
                        <p className="featuredCreatorCard__category">{creator.category || "General"}</p>
                        {creator.user?.city && (
                          <p className="featuredCreatorCard__city">📍 {creator.user.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="featuredCreatorCard__stats">
                      <div className="featuredCreatorCard__statItem">
                        <span className="featuredCreatorCard__statValue">{formatCompactNumber(creator.followers)}</span>
                        <span className="featuredCreatorCard__statLabel">Followers</span>
                      </div>
                      <div className="featuredCreatorCard__statItem">
                        <span className="featuredCreatorCard__statValue">{Number(creator.avg_views || 0) > 0 ? formatCompactNumber(creator.avg_views) : "—"}</span>
                        <span className="featuredCreatorCard__statLabel">Avg Views</span>
                      </div>
                      <div className="featuredCreatorCard__statItem">
                        <span className="featuredCreatorCard__statValue">{Number(creator.rating || 0).toFixed(1)}</span>
                        <span className="featuredCreatorCard__statLabel">Rating</span>
                      </div>
                    </div>

                    {activePlatforms.length > 0 && (
                      <div className="featuredCreatorCard__platforms">
                        {activePlatforms.map((label) => (
                          <span key={label} className="platformChip">{label}</span>
                        ))}
                      </div>
                    )}

                    {creatorBio ? (
                      <p className="featuredCreatorCard__bio">
                        {creatorBio.length > 100 ? `${creatorBio.slice(0, 97)}...` : creatorBio}
                      </p>
                    ) : null}

                    <div className="featuredCreatorCard__actions">
                      <Link className="featuredCreatorCard__cta" to={`/creator/${creatorUserId}`}>
                        View Profile
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {/* ── Pagination ── */}
          {!creatorsLoading && totalPages > 1 ? (
            <div className="explorePagination">
              <button
                type="button"
                className="explorePagination__btn"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                ← Prev
              </button>

              <div className="explorePagination__pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="explorePagination__ellipsis">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`explorePagination__page ${page === item ? "explorePagination__page--active" : ""}`}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                className="explorePagination__btn"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next →
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className="dashboardPanel">
          <h2>My Orders</h2>
          {ordersLoading ? (
            <SkeletonRows count={5} />
          ) : (
            <Table
              columns={[
                { key: "creator", label: "Creator" },
                { key: "package", label: "Package" },
                { key: "pricing", label: "Pricing Type" },
                { key: "status", label: "Status" },
              ]}
              rows={orderRows}
              emptyText="No orders yet."
            />
          )}
        </div>
      ) : null}

      {activeTab === "messages" ? (
        <div className="dashboardPanel">
          <h2>Messages</h2>
          {conversationsLoading ? <SkeletonRows count={5} /> : <MessageList items={conversationItems} />}
        </div>
      ) : null}

      {activeTab === "favorites" ? (
        <div className="dashboardPanel">
          <h2>Favorites</h2>
          <p>Saved creator lists are coming next. For now, use Explore Creators and shortlist in your workflow.</p>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <div className="dashboardPanel">
          <h2>Settings</h2>
          <p>Update company details and profile information.</p>
          <p style={{ marginTop: 10 }}>
            <Link className="link" to={`/brand/${brandProfile?.id || ""}`}>Open Brand Profile</Link>
          </p>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default BrandDashboard;

