import {
  Table,
  Tag,
  Alert,
  Space,
  Button,
  Input,
  Modal,
  Form,
  Row,
  Col,
  Popconfirm,
  message,
  Pagination,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ICategory } from "../types/category.type";

const API_URL = `https://projectbookstore-backendapi.onrender.com/api/v1/categories`;

// ========================================
// 🔹 FETCH CATEGORIES
// ========================================
const fetchCategories = async ({
  page = 1,
  limit = 5,
  keyword,
}: {
  page?: number;
  limit?: number;
  keyword?: string;
}) => {
  const params: any = { page, limit };
  if (keyword) params.keyword = keyword;

  const res = await axios.get(API_URL, { params });
  if (res.data?.data?.categories) return res.data.data;
  return res.data.data || res.data;
};

// ========================================
// 🔹 CREATE CATEGORY
// ========================================
const createCategory = async (values: any) => {
  const payload = {
    name: values.name,
    slug:
      values.slug ||
      values.name
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, ""),
    description: values.description,
  };
  return axios.post(API_URL, payload);
};

// ========================================
// 🔹 UPDATE CATEGORY
// ========================================
const updateCategory = async (id: string, values: any) => {
  const payload = {
    name: values.name,
    slug:
      values.slug ||
      values.name
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, ""),
    description: values.description,
  };
  return axios.put(`${API_URL}/${id}`, payload);
};

// ========================================
// 🔹 DELETE CATEGORY
// ========================================
const deleteCategory = async (id: string) => {
  return axios.delete(`${API_URL}/${id}`);
};

// ========================================
// 🔹 COMPONENT CHÍNH
// ========================================
const Categories = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);

  // URL Params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const keyword = searchParams.get("keyword") || "";

  // Update params
  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") newParams.delete(key);
      else newParams.set(key, String(value));
    });
    setSearchParams(newParams);
  };

  // Fetch categories
  const { data, isError, error, isFetching } = useQuery({
    queryKey: ["categories", page, limit, keyword],
    queryFn: () => fetchCategories({ page, limit, keyword }),
  });

  // ========================================
  // 🔹 LƯU (CREATE / UPDATE)
  // ========================================
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingCategory) {
        await updateCategory(editingCategory._id, values);
        message.success("Cập nhật thể loại thành công");
      } else {
        await createCategory(values);
        message.success("Thêm thể loại thành công");
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      console.error(err);
      message.error(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu thể loại"
      );
    }
  };

  // ========================================
  // 🔹 EDIT
  // ========================================
  const handleEdit = (record: ICategory) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // ========================================
  // 🔹 DELETE
  // ========================================
  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success("Xóa thể loại thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch {
      message.error("Xóa thể loại thất bại");
    }
  };

  // ========================================
  // 🔹 CỘT BẢNG
  // ========================================
  const columns = [
    {
      title: "Tên thể loại",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => desc || <Tag color="orange">Chưa có</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: ICategory) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(record._id!)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isError)
    return <Alert type="error" message={(error as Error).message} />;

  // ========================================
  // 🔹 UI
  // ========================================
  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl p-6">
        {/* Bộ lọc */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="text-lg font-semibold">
            Danh sách thể loại:
          </label>
          <Input.Search
            placeholder="Tìm thể loại..."
            allowClear
            enterButton
            defaultValue={keyword}
            onSearch={(value) => updateParams({ keyword: value, page: 1 })}
            className="!w-80"
          />

          <Button
            type="primary"
            className="ml-auto"
            onClick={() => {
              setIsModalOpen(true);
              setEditingCategory(null);
              form.resetFields();
            }}
          >
            Thêm thể loại
          </Button>
        </div>

        {/* Bảng */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={data?.categories || data?.data || []}
          loading={isFetching}
          pagination={false}
        />

        {/* Phân trang */}
        <div className="mt-4 text-right">
          <Pagination
            current={page}
            total={data?.totalRecords || data?.total || 0}
            pageSize={limit}
            onChange={(p) => updateParams({ page: p })}
            showTotal={(total) => `Tổng ${total} thể loại`}
          />
        </div>
      </div>

      {/* Modal thêm / sửa */}
      <Modal
        title={editingCategory ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Tên thể loại"
                rules={[
                  { required: true, message: "Nhập tên thể loại" },
                  { min: 3, message: "Tên thể loại tối thiểu 3 ký tự" },
                  { max: 50, message: "Tên thể loại tối đa 50 ký tự" },
                  {
                    whitespace: true,
                    message:
                      "Tên thể loại không được chứa khoảng trắng đầu/cuối",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập tên thể loại"
                  onChange={(e) => {
                    const slug = e.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)+/g, "");
                    form.setFieldsValue({ slug });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="slug"
                label="Slug"
                rules={[
                  { required: true, message: "Nhập slug" },
                  { min: 3, message: "Slug tối thiểu 3 ký tự" },
                  { max: 255, message: "Slug tối đa 255 ký tự" },
                  {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: "Slug chỉ chứa chữ thường, số, gạch ngang",
                  },
                ]}
              >
                <Input placeholder="vd: van-hoc" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label="Mô tả"
                rules={[
                  { max: 500, message: "Mô tả tối đa 500 ký tự" },
                ]}
              >
                <Input.TextArea rows={3} placeholder="Mô tả thể loại" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
