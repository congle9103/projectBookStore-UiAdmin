import { useState } from "react";
import { message } from "antd";
import {
  FaBoxOpen,
  FaShoppingCart,
  FaDollarSign,
  FaFileAlt,
  FaUsers,
  FaUserShield,
  FaCog,
  FaPalette,
  FaDatabase,
  FaSync,
  FaEnvelope,
  FaEye,
  FaTrash,
  FaGlobe,
  FaCompass,
  FaUserTie,
} from "react-icons/fa";
import { BiSolidCategory } from "react-icons/bi";

// Import các component pages
import Products from "./Products";
import Categories from "./Categories";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("products");

  const handleRefresh = () => window.location.reload();
  const handleMessage = () => message.info("Bạn có 3 tin nhắn mới từ admin.");
  const handlePreview = () => window.open("/", "_blank");
  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    message.success("Đã xóa cache thành công.");
  };

  const menuItems = [
    { key: "products", icon: <FaBoxOpen />, label: "Sản phẩm" },
    { key: "categories", icon: <BiSolidCategory />, label: "Danh mục" },
    { key: "orders", icon: <FaShoppingCart />, label: "Đơn hàng" },
    { key: "customers", icon: <FaUsers />, label: "Khách hàng" },
    { key: "staff", icon: <FaUserTie />, label: "Nhân viên" },
    { key: "ads", icon: <FaDollarSign />, label: "Quảng cáo" },
    { key: "posts", icon: <FaFileAlt />, label: "Bài viết" },
    { key: "admin", icon: <FaUserShield />, label: "Quản trị" },
    { key: "settings", icon: <FaCog />, label: "Hệ thống" },
    { key: "themes", icon: <FaPalette />, label: "Giao diện" },
    { key: "database", icon: <FaDatabase />, label: "Database" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "products":
        return <Products />;
      case "categories":
        return <Categories />;
      default:
        return <div className="p-6">Chức năng đang được phát triển...</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed top-0 h-screen w-64 bg-gray-900 text-gray-200 flex flex-col">
        <div className="p-6 text-center border-b border-gray-700">
          <h2 className="text-2xl font-bold text-blue-400">Admin-BookStore</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full cursor-pointer text-left transition
                ${
                  activeTab === item.key
                    ? "bg-gray-800 text-white font-semibold"
                    : "hover:bg-gray-800 hover:text-white"
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1">
        {/* Navbar 1 */}
        <header className="flex justify-end items-center gap-6 bg-white border-b h-16 px-6 shadow-sm">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FaSync className="text-gray-600" />
            <span className="text-gray-700 font-medium">Refresh</span>
          </button>

          <button
            onClick={handleMessage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FaEnvelope className="text-gray-600" />
            <span className="text-gray-700 font-medium">Admin message</span>
          </button>

          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FaEye className="text-gray-600" />
            <span className="text-gray-700 font-medium">Preview</span>
          </button>

          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-100 transition"
          >
            <FaTrash className="text-red-500" />
            <span className="text-red-600 font-medium">Clean cache</span>
          </button>
        </header>

        {/* Navbar 2 */}
        <nav className="flex items-center gap-6 bg-white border-b h-14 px-6 shadow-sm text-sm font-medium">
          {[
            { icon: <FaBoxOpen />, label: "Home" },
            { icon: <FaCompass />, label: "Set Navigator" },
            { icon: <FaShoppingCart />, label: "Good List" },
            { icon: <FaFileAlt />, label: "Order List" },
            { icon: <FaEnvelope />, label: "User Comments" },
            { icon: <FaUsers />, label: "User List" },
            { icon: <FaPalette />, label: "Setup Template" },
            { icon: <FaGlobe />, label: "Sitemap" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition"
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Content */}
        <main className="ml-64">{renderContent()}</main>
      </div>
    </div>
  );
};

export default DashboardPage;
