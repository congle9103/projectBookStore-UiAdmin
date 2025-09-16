import { Table, Input, Space, Button, Select } from "antd";
const { Search } = Input;

// Cột bảng sản phẩm
const productColumns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Tên sản phẩm", dataIndex: "product_name", key: "product_name" },
  { title: "Slug", dataIndex: "slug", key: "slug" },
  {
    title: "Giá",
    dataIndex: "price",
    key: "price",
    render: (price: number) => `$${price.toFixed(2)}`,
  },
  {
    title: "Giảm giá",
    dataIndex: "discount",
    key: "discount",
    render: (discount: number) => `${discount}%`,
  },
  { title: "Tồn kho", dataIndex: "stock", key: "stock" },
  { title: "Năm model", dataIndex: "model_year", key: "model_year" },
  { title: "Danh mục", dataIndex: ["category", "name"], key: "category" },
  { title: "Thương hiệu", dataIndex: ["brand", "name"], key: "brand" },
  {
    title: "Thao tác",
    key: "action",
    render: () => (
      <Space size="middle">
        <Button type="link">Chi tiết</Button>
        <Button type="link">Sửa</Button>
      </Space>
    ),
  },
];

// Data mẫu
const products = [
  {
    id: 1,
    product_name: "iPhone 15 Pro Max",
    slug: "iphone-15-pro-max",
    price: 1299.99,
    discount: 10,
    stock: 50,
    model_year: 2024,
    category: { id: 1, name: "Smartphones" },
    brand: { id: 1, name: "Apple" },
  },
  {
    id: 2,
    product_name: "Samsung Galaxy S24 Ultra",
    slug: "samsung-galaxy-s24-ultra",
    price: 1199.99,
    discount: 15,
    stock: 30,
    model_year: 2024,
    category: { id: 1, name: "Smartphones" },
    brand: { id: 2, name: "Samsung" },
  },
  {
    id: 3,
    product_name: "Xiaomi 14 Pro",
    slug: "xiaomi-14-pro",
    price: 899.99,
    discount: 5,
    stock: 80,
    model_year: 2024,
    category: { id: 1, name: "Smartphones" },
    brand: { id: 3, name: "Xiaomi" },
  },
];

const ProductsPage = () => {
  return (
    <div>
      <main className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center mb-4 gap-6">
            <h3 className="text-lg font-semibold w-80">Danh sách sản phẩm:</h3>

            <Search
              placeholder="Tìm sản phẩm"
              allowClear
              className="w-64"
              onSearch={(value) => console.log("Search:", value)}
            />

            <Select
              placeholder="Lọc theo giá"
              className="w-48"
              onChange={(value) => console.log("Filter price:", value)}
              options={[
                { value: "low", label: "Thấp đến cao" },
                { value: "high", label: "Cao đến thấp" },
              ]}
            />

            <Select
              placeholder="Lọc theo thể loại"
              className="w-60"
              onChange={(value) => console.log("Filter category:", value)}
              options={[
                { value: "Lịch sử Việt Nam", label: "Lịch sử Việt Nam" },
                { value: "Truyện tranh", label: "Truyện tranh" },
                { value: "Văn học", label: "Văn học" },
                { value: "Tâm lý kỹ năng", label: "Tâm lý kỹ năng" },
                { value: "Thiếu nhi", label: "Thiếu nhi" },
                { value: "Sách học ngoại ngữ", label: "Sách học ngoại ngữ" },
                { value: "Ngoại văn", label: "Ngoại văn" },
              ]}
            />
          </div>
          <Table
            columns={productColumns}
            dataSource={products}
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;
