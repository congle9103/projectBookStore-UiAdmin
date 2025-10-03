import {
  Table,
  Image,
  Tag,
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
  message,
  Popconfirm,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import type { Product, ProductResponse } from "../types/product.type";
import type { QueryFunction } from "@tanstack/react-query";

// API fetch products
const fetchProducts: QueryFunction<ProductResponse, [string, { sort?: string; category?: string }]> = async ({ queryKey }) => {
  const [, { sort, category }] = queryKey;
  const res = await axios.get<ProductResponse>(
    "https://projectbookstore-backendapi.onrender.com/api/v1/products",
    {
      params: { sort, category },
    }
  );
  return res.data;
};

// Hàm sinh slug từ tên
const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Products = () => {
  const [sort, setSort] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Query sản phẩm
  const {
  data: products,
  isError,
  error,
  isFetching,
} = useQuery({
  queryKey: ["products", { sort, category }],
  queryFn: fetchProducts,
});

  // Save (Add hoặc Edit)
  const handleSaveProduct = async () => {
    try {
      const values = await form.validateFields();

      // Tự sinh slug nếu chưa nhập
      if (!values.slug) {
        values.slug = generateSlug(values.product_name);
        form.setFieldValue("slug", values.slug);
      }

      // authors & thumbnails dạng chuỗi => mảng
      if (typeof values.authors === "string") {
        values.authors = values.authors.split(",").map((a: string) => a.trim());
      }
      if (typeof values.thumbnails === "string") {
        values.thumbnails = values.thumbnails
          .split(",")
          .map((t: string) => t.trim());
      }

      if (editingProduct) {
        // Update
        await axios.put(
          `https://projectbookstore-backendapi.onrender.com/api/v1/products/${editingProduct._id}`,
          values
        );
        message.success("Cập nhật sản phẩm thành công");
      } else {
        // Add
        await axios.post(
          "https://projectbookstore-backendapi.onrender.com/api/v1/products",
          values
        );
        message.success("Thêm sản phẩm thành công");
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err instanceof Error) {
        message.error(err.message);
      } else {
        message.error("Có lỗi xảy ra khi lưu sản phẩm");
      }
    }
  };

  // Edit
  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue({
      ...record,
      authors: record.authors?.join(", "),
      thumbnails: record.thumbnails?.join(", "),
    });
    setIsModalOpen(true);
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(
        `https://projectbookstore-backendapi.onrender.com/api/v1/products/${id}`
      );
      message.success("Xóa sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  // Hàm tìm kiếm không dấu
  const normalizeText = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "");

  // Table columns
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnails",
      key: "thumbnails",
      render: (thumbs: string[]) => <Image src={thumbs?.[0]} width={60} />,
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
      render: (authors: string[]) => authors?.join(", "),
    },
    { title: "NXB", dataIndex: "publisher", key: "publisher" },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
      render: (price: number) => <span>{price?.toLocaleString()} đ</span>,
    },
    {
      title: "Giá gốc",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (price: number) => (
        <span className="line-through">{price?.toLocaleString()} đ</span>
      ),
    },
    {
      title: "Giảm giá",
      dataIndex: "discountPercent",
      key: "discountPercent",
      render: (percent: number) => (
        <Tag color={percent > 0 ? "green" : "red"}>{percent}%</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: Product) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isError) return <Alert type="error" message={(error as Error).message} />;

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
              enterButton
              onChange={(e) => setSearchTerm(e.target.value)}
              className="!w-120"
            />

            <Select
              placeholder="Lọc theo giá"
              className=" !w-30 [&_.ant-select-selector]:!border-gray-600 [&_.ant-select-selector]:!font-semibold [&_.ant-select-selection-placeholder]:!font-semibold [&_.ant-select-selection-placeholder]:!text-gray-600 "
              value={sort}
              onChange={(value) => setSort(value)}
              options={[
                {
                  value: "",
                  label: <span className="font-semibold">Lọc theo giá</span>,
                },
                {
                  value: "asc",
                  label: <span className="font-semibold">Thấp đến cao</span>,
                },
                {
                  value: "desc",
                  label: <span className="font-semibold">Cao đến thấp</span>,
                },
              ]}
            />

            <Select
              placeholder="Lọc theo thể loại"
              className=" !w-40 [&_.ant-select-selector]:!border-gray-600 [&_.ant-select-selector]:!font-semibold [&_.ant-select-selection-placeholder]:!font-semibold [&_.ant-select-selection-placeholder]:!text-gray-600 "
              value={category}
              onChange={(value) => setCategory(value)}
              options={[
                {
                  value: "",
                  label: <span className="font-semibold">Tất cả thể loại</span>,
                },
                {
                  value: "64f0c1e2a1234567890abc01",
                  label: (
                    <span className="font-semibold">Lịch sử Việt Nam</span>
                  ),
                },
                {
                  value: "68c4281d95425c0d0db09d4d",
                  label: <span className="font-semibold">Văn học</span>,
                },
                {
                  value: "1",
                  label: <span className="font-semibold">Truyện tranh</span>,
                },
                {
                  value: "2",
                  label: <span className="font-semibold">Tâm lý kỹ năng</span>,
                },
                {
                  value: "3",
                  label: <span className="font-semibold">Thiếu nhi</span>,
                },
                {
                  value: "4",
                  label: (
                    <span className="font-semibold">Sách học ngoại ngữ</span>
                  ),
                },
                {
                  value: "5",
                  label: <span className="font-semibold">Ngoại văn</span>,
                },
              ]}
            />

            <Button
              type="primary"
              onClick={() => {
                setIsModalOpen(true);
                setEditingProduct(null);
                form.resetFields();
              }}
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
            loading={isFetching} // chỉ loading bảng
            scroll={{ x: true }}
          />
        </div>
      </main>

      {/* Modal Add/Edit Product */}
      <Modal
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onOk={handleSaveProduct}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
      >
        {/* Giữ nguyên UI Form bạn gửi */}
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_name"
                label="Tên sản phẩm"
                rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item name="slug" label="Slug">
                <Input placeholder="Tự sinh nếu để trống" />
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
