import {
  Table,
  Image,
  Tag,
  Spin,
  Alert,
  Select,
  Space,
  Button,
  Input,
  Modal,
  Form,
  Row,
  Col,
  Checkbox,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import type { Product } from "../types/product.type";

type QueryKey = [string, { sort?: string; category?: string }];

// Fetch products
const fetchProducts = async ({ queryKey }: { queryKey: QueryKey }) => {
  const [, { sort, category }] = queryKey;
  const res = await axios.get("http://localhost:8080/api/v1/products", {
    params: { sort, category },
  });
  return res.data;
};

const Products = () => {
  const [sort, setSort] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products", { sort, category }],
    queryFn: fetchProducts,
  });

  // State + Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  const handleAddProduct = () => {
    form.validateFields().then((values) => {
      console.log("New product:", values);
      setIsModalOpen(false);
      form.resetFields();
      // TODO: axios.post("http://localhost:8080/api/v1/products", values)
    });
  };

  const handleEdit = (id: string) => {
    console.log("Edit:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete:", id);
  };

  // Hàm tìm tên các sản phẩm
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD") // tách dấu khỏi ký tự
      .replace(/[\u0300-\u036f]/g, "") // xóa dấu
      .replace(/đ/g, "d") // thay đ → d
      .replace(/[^a-z0-9\s]/g, ""); // bỏ ký tự đặc biệt (nếu cần)
  };

  // Table columns
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnails",
      key: "thumbnails",
      render: (thumbs: string[]) => <Image src={thumbs[0]} width={60} />,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Tác giả",
      dataIndex: "authors",
      key: "authors",
      render: (authors: string[]) => authors.join(", "),
    },
    {
      title: "Thể loại",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
      render: (price: number) => <span>{price.toLocaleString()} đ</span>,
    },
    {
      title: "Giá gốc",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (price: number) => (
        <span className="line-through">{price.toLocaleString()} đ</span>
      ),
    },
    {
      title: "Giảm giá",
      dataIndex: "discountPercent",
      key: "discountPercent",
      render: (percent: number) => (
        <Tag color={percent < 0 ? "red" : "green"}>{percent}%</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: Product) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record._id)}>
            Edit
          </Button>
          <Button danger onClick={() => handleDelete(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (isLoading) return <Spin tip="Đang tải sản phẩm..." />;
  if (isError) return <Alert type="error" message={error.message} />;

  return (
    <div>
      <main className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          {/* Header filter */}
          <div className="flex items-center mb-4 gap-6">
            <h3 className="text-lg font-semibold w-48">Danh sách sản phẩm:</h3>

            <Search
              placeholder="Tìm sản phẩm"
              allowClear
              enterButton // <- hiện nút Search mặc định
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
              !w-120
              [&_.ant-input-affix-wrapper]:!border-gray-500
              [&_.ant-input]:placeholder-gray-500
              [&_.ant-btn]:!bg-blue-500 [&_.ant-btn]:!text-white
              [&_.ant-btn]:hover:!bg-blue-700
            "
            />

            <Select
              placeholder="Lọc theo giá"
              className="
              !w-30
              [&_.ant-select-selector]:!border-gray-600
              [&_.ant-select-selector]:!font-semibold
              [&_.ant-select-selection-placeholder]:!font-semibold
              [&_.ant-select-selection-placeholder]:!text-gray-600
            "
              value={sort}
              onChange={(value) => setSort(value)} // cập nhật state sort
              options={[
                { value: "", label: "Lọc theo giá" },
                { value: "asc", label: "Thấp đến cao" },
                { value: "desc", label: "Cao đến thấp" },
              ]}
            />

            <Select
              placeholder="Lọc theo thể loại"
              className="
              !w-40
              [&_.ant-select-selector]:!border-gray-600
              [&_.ant-select-selector]:!font-semibold
              [&_.ant-select-selection-placeholder]:!font-semibold
              [&_.ant-select-selection-placeholder]:!text-gray-600
            "
              value={category}
              onChange={(value) => setCategory(value)} // cập nhật state category
              options={[
                { value: "", label: "Tất cả thể loại" },
                {
                  value: "64f0c1e2a1234567890abc01",
                  label: "Lịch sử Việt Nam",
                },
                { value: "68c4281d95425c0d0db09d4d", label: "Văn học" },
                { value: "1", label: "Truyện tranh" },
                { value: "2", label: "Tâm lý kỹ năng" },
                { value: "3", label: "Thiếu nhi" },
                { value: "4", label: "Sách học ngoại ngữ" },
                { value: "5", label: "Ngoại văn" },
              ]}
            />

            <Button
              type="primary"
              onClick={() => setIsModalOpen(true)}
              className="ml-auto"
            >
              Add Product
            </Button>
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={
              Array.isArray(products?.data)
                ? products.data.filter((p: Product) =>
                    normalizeText(p.product_name).includes(
                      normalizeText(searchTerm)
                    )
                  )
                : []
            }
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </div>
      </main>

      {/* Modal Add Product */}
      <Modal
        title="Thêm sản phẩm mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddProduct}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            {/* Cột trái */}
            <Col span={12}>
              <Form.Item
                name="product_name"
                label="Tên sản phẩm"
                rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="slug"
                label="Slug"
                rules={[{ required: true, message: "Nhập slug" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="category_id"
                label="Thể loại"
                rules={[{ required: true, message: "Chọn thể loại" }]}
              >
                <Select
                  options={[
                    { value: "650f5c4a3a...", label: "Lịch sử Việt Nam" },
                    { value: "650f5c4a3b...", label: "Truyện tranh" },
                    { value: "650f5c4a3c...", label: "Văn học" },
                    { value: "650f5c4a3d...", label: "Tâm lý kỹ năng" },
                    { value: "650f5c4a3e...", label: "Thiếu nhi" },
                    { value: "650f5c4a3f...", label: "Sách học ngoại ngữ" },
                    { value: "650f5c4a40...", label: "Ngoại văn" },
                  ]}
                />
              </Form.Item>

              <Form.Item name="supplier" label="Nhà cung cấp">
                <Input />
              </Form.Item>

              <Form.Item name="publisher" label="Nhà xuất bản">
                <Input />
              </Form.Item>

              <Form.Item name="authors" label="Tác giả">
                <Input.TextArea placeholder="Ngăn cách bởi dấu phẩy" rows={2} />
              </Form.Item>
            </Col>

            {/* Cột phải */}
            <Col span={12}>
              <Form.Item name="thumbnails" label="Ảnh (URL)">
                <Input.TextArea placeholder="Ngăn cách bởi dấu phẩy" rows={2} />
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Giá bán"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="originalPrice" label="Giá gốc">
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="discountPercent" label="Giảm giá (%)">
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="publicationYear" label="Năm XB">
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="language" label="Ngôn ngữ">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="weight" label="Trọng lượng (gr)">
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="dimensions" label="Kích thước">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="pages" label="Số trang">
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="format" label="Hình thức">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* Checkbox flags */}
          <Row gutter={16}>
            <Col>
              <Form.Item name="isNew" valuePropName="checked">
                <Checkbox>Mới</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="isPopular" valuePropName="checked">
                <Checkbox>Phổ biến</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="isFlashSale" valuePropName="checked">
                <Checkbox>Flash Sale</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
