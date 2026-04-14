import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userState } from "../../../atoms";
import { DashboardLayout, MessageList, SkeletonRows, StatCard, Table } from "../../../components";
import { useConversations, useCreators, useOrders, usePackages } from "../../../hooks/useDashboardApi";
import useDashboardTab from "../../../hooks/useDashboardTab";
import "../dashboardPages.scss";

const BrandDashboard = () => {
  const user = useRecoilValue(userState);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");

  const { data: creators = [], isLoading: creatorsLoading } = useCreators();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const { data: packages = [] } = usePackages(["packages", "brand-explore"]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
  const filteredCreators = creators.filter((creator) => {
    const matchedCategory = !categoryFilter || creator.category === categoryFilter;
    if (!matchedCategory) return false;

    const creatorPackages = packages.filter((pkg) => pkg.creator_id === creator.id);
    const matchedPlatform = !platformFilter || creatorPackages.some((pkg) => pkg.platform === platformFilter);
    if (!matchedPlatform) return false;

    const matchedPrice =
      !priceFilter ||
      creatorPackages.some((pkg) => Number(pkg.price || 0) <= Number(priceFilter));

    return matchedPrice;
  });

  const creatorRows = filteredCreators.map((creator) => ({
    key: creator.id,
    name: creator.user?.username || "Creator",
    category: creator.category || "-",
    followers: Number(creator.followers || 0).toLocaleString("en-PK"),
    rating: Number(creator.rating || 0).toFixed(1),
    cta: <Link className="dashboardAction link" to={`/creator/${creator.id}`}>View Profile</Link>,
  }));

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
      value: Math.min(creatorRows.length, 12),
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
        <div className="dashboardPanel">
          <h2>Explore Creators</h2>
          <div className="dashboardFilters" style={{ marginBottom: 12 }}>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">All categories</option>
              {creatorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
              <option value="">All platforms</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="MULTI_PLATFORM">Multi Platform</option>
            </select>
            <input
              type="number"
              min="0"
              placeholder="Max price (PKR)"
              value={priceFilter}
              onChange={(event) => setPriceFilter(event.target.value)}
            />
          </div>

          {creatorsLoading ? (
            <SkeletonRows count={6} />
          ) : (
            <Table
              columns={[
                { key: "name", label: "Creator" },
                { key: "category", label: "Category" },
                { key: "followers", label: "Followers" },
                { key: "rating", label: "Engagement" },
                { key: "cta", label: "Action" },
              ]}
              rows={creatorRows}
              emptyText="No creators match your filters."
            />
          )}
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
            <Link className="link" to={`/brand/${user?.id || ""}`}>Open Brand Profile</Link>
          </p>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default BrandDashboard;

