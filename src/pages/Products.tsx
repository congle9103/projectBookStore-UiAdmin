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
  Pagination,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Product } from "../types/product.type";

const API_URL = `https://projectbookstore-backendapi.onrender.com/api/v1/products?page=${page}&limit=${limit}`;

// ========================================
// 🔹 Hàm gọi API backend (chuẩn service findAll)
// ========================================
const fetchProducts = async ({
  page = 1,
  limit = 5,
  keyword,
  sort_by = "createdAt",
  sort_type = "desc",
  cat_id,
}: {
  page?: number;
  limit?: number;
  keyword?: string;
  sort_by?: string;
  sort_type?: string;
  cat_id?: string;
}) => {
  const res = await axios.get(API_URL, {
    params: { page, limit, keyword, sort_by, sort_type, cat_id },
  });
  if (res.data?.data) return res.data.data; // nếu dùng sendJsonSuccess
  return res.data; // fallback nếu trả về trực tiếp
};

// ========================================
// 🔹 Component chính
// ========================================
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Lấy params từ URL
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const keyword = searchParams.get("keyword") || "";
  const sort_by = searchParams.get("sort_by") || "createdAt";
  const sort_type = searchParams.get("sort_type") || "desc";
  const cat_id = searchParams.get("cat_id") || "";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ========================================
  // 🔹 Gọi API qua React Query
  // ========================================
  const {
    data,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["products", page, limit, keyword, sort_by, sort_type, cat_id],
    queryFn: () => fetchProducts({ page, limit, keyword, sort_by, sort_type, cat_id }),
  });

  console.log("data", data);
  
  const products = data || [];

  // ========================================
  // 🔹 Cập nhật query params (lọc, phân trang)
  // ========================================
  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") newParams.delete(key);
      else newParams.set(key, String(value));
    });
    setSearchParams(newParams);
  };

  // ========================================
  // 🔹 Thêm / Sửa / Xóa sản phẩm
  // ========================================
  const handleSaveProduct = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        await axios.put(`${API_URL}/${editingProduct._id}`, values);
        message.success("Cập nhật sản phẩm thành công");
      } else {
        await axios.post(API_URL, values);
        message.success("Thêm sản phẩm thành công");
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      message.error("Có lỗi xảy ra khi lưu sản phẩm");
    }
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      message.success("Xóa sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch {
      message.error("Xóa thất bại");
    }
  };

  // ========================================
  // 🔹 Cấu hình cột bảng
  // ========================================
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumb: string) => (
        <Image
          src={
            thumb?.startsWith("http")
              ? thumb
              : `${import.meta.env.VITE_BACKEND_URL_STATIC}/${thumb}`
          }
          width={60}
        />
      ),
    },
    { title: "Tên sản phẩm", dataIndex: "product_name", key: "product_name" },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `${price?.toLocaleString()} đ`,
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
      title: "Thao tác",
      key: "action",
      render: (record: Product) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isError) return <Alert type="error" message={(error as Error).message} />;

  // ========================================
  // 🔹 UI
  // ========================================
  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl p-6">
        {/* Bộ lọc */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Search
            placeholder="Tìm sản phẩm..."
            allowClear
            enterButton
            defaultValue={keyword}
            onSearch={(value) => updateParams({ keyword: value, page: 1 })}
            className="!w-64"
          />

          <Select
            placeholder="Thể loại"
            className="!w-40"
            value={cat_id || undefined}
            onChange={(value) => updateParams({ cat_id: value, page: 1 })}
            options={[
              { value: "", label: "Tất cả" },
              { value: "history", label: "Lịch sử" },
              { value: "novel", label: "Văn học" },
              { value: "comic", label: "Truyện tranh" },
              { value: "children", label: "Thiếu nhi" },
              { value: "skills", label: "Kỹ năng" },
              { value: "foreign", label: "Ngoại văn" },
            ]}
          />

          <Select
            placeholder="Sắp xếp theo giá"
            className="!w-48"
            value={sort_type || undefined}
            onChange={(value) => updateParams({ sort_type: value, sort_by: "price" })}
            options={[
              { value: "asc", label: "Giá thấp → cao" },
              { value: "desc", label: "Giá cao → thấp" },
            ]}
          />

          <Button
            type="primary"
            className="ml-auto"
            onClick={() => {
              setIsModalOpen(true);
              setEditingProduct(null);
              form.resetFields();
            }}
          >
            Thêm sản phẩm
          </Button>
        </div>

        {/* Bảng */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={products}
          loading={isFetching}
          pagination={false}
        />

        {/* Phân trang */}
        <div className="mt-4 text-right">
          <Pagination
            current={page}
            total={20}
            pageSize={limit}
            onChange={(p) => updateParams({ page: p })}
            showTotal={(t) => `Tổng ${t} sản phẩm`}
          />
        </div>
      </div>

      {/* Modal Add/Edit */}
      <Modal
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveProduct}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_name"
                label="Tên sản phẩm"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="price" label="Giá">
                <Input type="number" />
              </Form.Item>
              <Form.Item name="discountPercent" label="Giảm giá (%)">
                <Input type="number" />
              </Form.Item>
              <Form.Item name="category_id" label="Thể loại">
                <Select />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="thumbnail" label="Ảnh (URL)">
                <Input />
              </Form.Item>
              <Form.Item name="isNew" valuePropName="checked">
                <Checkbox>Mới</Checkbox>
              </Form.Item>
              <Form.Item name="isPopular" valuePropName="checked">
                <Checkbox>Phổ biến</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
