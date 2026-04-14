import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DashboardLayout,
  SkeletonRows,
  StatCard,
  Table,
} from "../../../components";
import { getApiErrorMessage, updateUser } from "../../../api";
import { useAdminCollections } from "../../../hooks/useDashboardApi";
import useDashboardTab from "../../../hooks/useDashboardTab";
import "../dashboardPages.scss";

const extractUsers = (payload) => (Array.isArray(payload) ? payload : payload?.content || payload?.data || []);

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminCollections();

  const mutation = useMutation({
    mutationFn: ({ userId, is_active }) => updateUser(userId, { is_active }),
    onSuccess: () => {
      toast.success("User status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const users = extractUsers(data?.users);
  const creators = extractUsers(data?.creators);
  const brands = extractUsers(data?.brands);
  const packages = Array.isArray(data?.packages) ? data.packages : [];
  const orders = Array.isArray(data?.orders) ? data.orders : [];

  const userRows = users.map((user) => ({
    key: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.is_active ? "Active" : "Disabled",
    action: (
      <button
        className="dashboardAction"
        type="button"
        onClick={() => mutation.mutate({ userId: user.id, is_active: !user.is_active })}
      >
        {user.is_active ? "Deactivate" : "Activate"}
      </button>
    ),
  }));

  const sidebarItems = [
    { key: "users", label: "Users" },
    { key: "creators", label: "Creators" },
    { key: "brands", label: "Brands" },
    { key: "packages", label: "Packages" },
    { key: "orders", label: "Orders" },
  ];
  const { activeTab, setActiveTab } = useDashboardTab({
    validTabs: sidebarItems.map((item) => item.key),
    defaultTab: "users",
  });

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Manage platform users and marketplace activity"
      sidebarItems={sidebarItems}
      activeKey={activeTab}
      onSelect={setActiveTab}
    >
      <div className="dashboardGrid">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Creators" value={creators.length} />
        <StatCard label="Brands" value={brands.length} />
        <StatCard label="Open Orders" value={orders.filter((order) => order.status !== "COMPLETED").length} />
      </div>

      <div className="dashboardPanel">
        <h2>{sidebarItems.find((item) => item.key === activeTab)?.label}</h2>

        {isLoading ? (
          <SkeletonRows count={7} />
        ) : null}

        {!isLoading && activeTab === "users" ? (
          <Table
            columns={[
              { key: "username", label: "Username" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status" },
              { key: "action", label: "Action" },
            ]}
            rows={userRows}
            emptyText="No users found."
          />
        ) : null}

        {!isLoading && activeTab === "creators" ? (
          <Table
            columns={[
              { key: "username", label: "Creator" },
              { key: "category", label: "Category" },
              { key: "followers", label: "Followers" },
              { key: "rating", label: "Rating" },
            ]}
            rows={creators.map((creator) => ({
              key: creator.id,
              username: creator.user?.username || "Creator",
              category: creator.category || "-",
              followers: Number(creator.followers || 0).toLocaleString("en-PK"),
              rating: Number(creator.rating || 0).toFixed(1),
            }))}
          />
        ) : null}

        {!isLoading && activeTab === "brands" ? (
          <Table
            columns={[
              { key: "company", label: "Company" },
              { key: "industry", label: "Industry" },
              { key: "city", label: "City" },
              { key: "website", label: "Website" },
            ]}
            rows={brands.map((brand) => ({
              key: brand.id,
              company: brand.company_name || brand.user?.username || "Brand",
              industry: brand.industry || "-",
              city: brand.user?.city || "-",
              website: brand.website || "-",
            }))}
          />
        ) : null}

        {!isLoading && activeTab === "packages" ? (
          <Table
            columns={[
              { key: "title", label: "Title" },
              { key: "platform", label: "Platform" },
              { key: "pricing", label: "Pricing" },
              { key: "status", label: "Status" },
            ]}
            rows={packages.map((pkg) => ({
              key: pkg.id,
              title: pkg.title,
              platform: pkg.platform,
              pricing:
                pkg.pricing_type === "BARTER"
                  ? "BARTER"
                  : `PKR ${Number(pkg.price || 0).toLocaleString("en-PK")}`,
              status: pkg.is_active ? "Active" : "Inactive",
            }))}
          />
        ) : null}

        {!isLoading && activeTab === "orders" ? (
          <Table
            columns={[
              { key: "packageTitle", label: "Package" },
              { key: "creatorName", label: "Creator" },
              { key: "brandName", label: "Brand" },
              { key: "status", label: "Status" },
            ]}
            rows={orders.map((order) => ({
              key: order.id,
              packageTitle: order.packageTitle,
              creatorName: order.creatorName,
              brandName: order.brandName,
              status: order.status,
            }))}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

