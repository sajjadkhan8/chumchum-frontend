import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userState } from "../../../atoms";
import { deletePackage, getApiErrorMessage } from "../../../api";
import { formatSupportedPlatformLabel } from "../../../utils/platforms";
import {
  DashboardLayout,
  MessageList,
  SkeletonRows,
  StatCard,
  Table,
} from "../../../components";
import { useConversations, useMyPackages, useOrders } from "../../../hooks/useDashboardApi";
import useDashboardTab from "../../../hooks/useDashboardTab";
import "../dashboardPages.scss";

const CreatorDashboard = () => {
  const user = useRecoilValue(userState);
  const queryClient = useQueryClient();
  const sidebarItems = [
    { key: "overview", label: "Dashboard" },
    { key: "packages", label: "My Packages" },
    { key: "orders", label: "Orders" },
    { key: "messages", label: "Messages" },
    { key: "earnings", label: "Earnings" },
    { key: "settings", label: "Profile Settings" },
  ];
  const { activeTab, setActiveTab } = useDashboardTab({
    validTabs: sidebarItems.map((item) => item.key),
    defaultTab: "overview",
  });

  const { data: packages = [], isLoading: packagesLoading } = useMyPackages();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const mutation = useMutation({
    mutationFn: (packageId) => deletePackage(packageId),
    onSuccess: () => {
      toast.success("Package deleted.");
      queryClient.invalidateQueries({ queryKey: ["packages", "my"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const creatorOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.creatorId === user?.id ||
          (order.creatorName || "").toLowerCase() === (user?.username || "").toLowerCase()
      ),
    [orders, user]
  );

  const paidCompletedOrders = creatorOrders.filter(
    (order) => order.status === "COMPLETED" && order.pricing_type !== "BARTER"
  );
  const barterOrders = creatorOrders.filter((order) => order.pricing_type === "BARTER");
  const totalEarnings = paidCompletedOrders.reduce((sum, order) => sum + Number(order.price || 0), 0);

  const stats = [
    {
      label: "Total Earnings",
      value: `PKR ${totalEarnings.toLocaleString("en-PK")}`,
      helper: "Completed paid orders",
    },
    {
      label: "Active Orders",
      value: creatorOrders.filter((order) => order.status === "ACTIVE").length,
      helper: "In progress",
    },
    {
      label: "Completed Orders",
      value: creatorOrders.filter((order) => order.status === "COMPLETED").length,
      helper: "Delivered successfully",
    },
    {
      label: "Profile Views",
      value: Math.max(125, packages.length * 31),
      helper: "Mock metric",
    },
  ];

  const packageRows = packages.map((item) => ({
    key: item.id,
    title: <strong>{item.title}</strong>,
    pricing:
      item.pricing_type === "BARTER" ? (
        <span className="badge barter">🎁 Barter Deal</span>
      ) : (
        `💰 PKR ${Number(item.price || 0).toLocaleString("en-PK")}`
      ),
    platform: formatSupportedPlatformLabel(item.platform),
    status: <span className={`badge ${item.is_active ? "active" : "inactive"}`}>{item.is_active ? "Active" : "Inactive"}</span>,
    action: (
      <div>
        <Link to={`/package/${item.id}`} className="dashboardAction link">View</Link>{" "}
        <button className="dashboardAction" type="button" onClick={() => mutation.mutate(item.id)}>
          Delete
        </button>
      </div>
    ),
  }));

  const orderRows = creatorOrders.map((order) => ({
    key: order.id,
    package: order.packageTitle,
    brand: order.brandName,
    status: order.status,
    pricing:
      order.pricing_type === "BARTER" ? (
        <span className="badge barter">🎁 Barter Deal</span>
      ) : (
        `💰 PKR ${Number(order.price || 0).toLocaleString("en-PK")}`
      ),
  }));

  const conversationItems = conversations.map((conversation) => ({
    conversationID: conversation.conversationID || conversation.id || conversation._id,
    counterparty: conversation.buyerID?.username || conversation.brand?.company_name || "Brand",
    lastMessage: conversation.lastMessage,
    updatedAt: conversation.updatedAt || conversation.updated_at,
  }));

  return (
    <DashboardLayout
      title="Creator Dashboard"
      subtitle={`Welcome back, ${user?.username || "Creator"}`}
      sidebarItems={sidebarItems}
      activeKey={activeTab}
      onSelect={setActiveTab}
    >
      {activeTab === "overview" ? (
        <>
          <div className="dashboardGrid">{stats.map((item) => <StatCard key={item.label} {...item} />)}</div>
          <div className="dashboardPanel">
            <h2>Recent Orders</h2>
            {ordersLoading ? (
              <SkeletonRows count={4} />
            ) : (
              <Table
                columns={[
                  { key: "package", label: "Package" },
                  { key: "brand", label: "Brand" },
                  { key: "status", label: "Status" },
                  { key: "pricing", label: "Pricing" },
                ]}
                rows={orderRows.slice(0, 6)}
                emptyText="No orders yet."
              />
            )}
          </div>
        </>
      ) : null}

      {activeTab === "packages" ? (
        <div className="dashboardPanel">
          <div className="dashboardPanelTitle">
            <h2>My Packages</h2>
            <Link className="link" to="/packages/new">
              <button type="button">Create New Package</button>
            </Link>
          </div>
          {packagesLoading ? (
            <SkeletonRows count={5} />
          ) : (
            <Table
              columns={[
                { key: "title", label: "Title" },
                { key: "pricing", label: "Price" },
                { key: "platform", label: "Platform" },
                { key: "status", label: "Status" },
                { key: "action", label: "Actions" },
              ]}
              rows={packageRows}
              emptyText="No packages found."
            />
          )}
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className="dashboardPanel">
          <h2>Orders</h2>
          {ordersLoading ? (
            <SkeletonRows count={5} />
          ) : (
            <Table
              columns={[
                { key: "package", label: "Package" },
                { key: "brand", label: "Brand" },
                { key: "status", label: "Status" },
                { key: "pricing", label: "Pricing Type" },
              ]}
              rows={orderRows}
              emptyText="No creator orders available."
            />
          )}
        </div>
      ) : null}

      {activeTab === "messages" ? (
        <div className="dashboardPanel">
          <h2>Messages</h2>
          {conversationsLoading ? <SkeletonRows count={4} /> : <MessageList items={conversationItems} />}
        </div>
      ) : null}

      {activeTab === "earnings" ? (
        <div className="dashboardGrid">
          <StatCard
            label="Paid Earnings"
            value={`💰 PKR ${totalEarnings.toLocaleString("en-PK")}`}
            helper="Only paid completed orders"
          />
          <StatCard
            label="Barter Deals"
            value={`🎁 ${barterOrders.length}`}
            helper="Non-cash collaborations"
          />
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <div className="dashboardPanel">
          <h2>Profile Settings</h2>
          <p>Manage your creator profile details from your profile page.</p>
          <p style={{ marginTop: 10 }}>
            <Link className="link" to={`/creator/${user?.id || ""}`}>Open Creator Profile</Link>
          </p>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default CreatorDashboard;

