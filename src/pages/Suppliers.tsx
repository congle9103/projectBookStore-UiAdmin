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
import type { ISupplier } from "../types/supplier.type";

const API_URL = `https://projectbookstore-backendapi.onrender.com/api/v1/suppliers`;

// ========================================
// 🔹 FETCH SUPPLIERS
// ========================================
const fetchSuppliers = async ({
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
  if (res.data?.data?.suppliers) return res.data.data;
  return res.data.data || res.data;
};

// ========================================
// 🔹 CREATE SUPPLIER
// ========================================
const createSupplier = async (values: any) => {
  const payload = {
    name: values.name,
    description: values.description,
  };
  return axios.post(API_URL, payload);
};

// ========================================
// 🔹 UPDATE SUPPLIER
// ========================================
const updateSupplier = async (id: string, values: any) => {
  const payload = {
    name: values.name,
    description: values.description,
  };
  return axios.put(`${API_URL}/${id}`, payload);
};

// ========================================
// 🔹 DELETE SUPPLIER
// ========================================
const deleteSupplier = async (id: string) => {
  return axios.delete(`${API_URL}/${id}`);
};

// ========================================
// 🔹 COMPONENT CHÍNH
// ========================================
const Suppliers = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);

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

  // Fetch suppliers
  const { data, isError, error, isFetching } = useQuery({
    queryKey: ["suppliers", page, limit, keyword],
    queryFn: () => fetchSuppliers({ page, limit, keyword }),
  });

  // ========================================
  // 🔹 LƯU (CREATE / UPDATE)
  // ========================================
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, values);
        message.success("Cập nhật nhà cung cấp thành công");
      } else {
        await createSupplier(values);
        message.success("Thêm nhà cung cấp thành công");
      }

      setIsModalOpen(false);
      setEditingSupplier(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch (err: any) {
      console.error(err);
      message.error(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu nhà cung cấp"
      );
    }
  };

  // ========================================
  // 🔹 EDIT
  // ========================================
  const handleEdit = (record: ISupplier) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // ========================================
  // 🔹 DELETE
  // ========================================
  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      message.success("Xóa nhà cung cấp thành công");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch {
      message.error("Xóa nhà cung cấp thất bại");
    }
  };

  // ========================================
  // 🔹 CỘT BẢNG
  // ========================================
  const columns = [
    {
      title: "Tên nhà cung cấp",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (text: string) => <i>{text}</i>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => desc || <Tag color="orange">Chưa có</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: ISupplier) => (
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
            Danh sách nhà cung cấp:
          </label>
          <Input.Search
            placeholder="Tìm nhà cung cấp..."
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
              setEditingSupplier(null);
              form.resetFields();
            }}
          >
            Thêm nhà cung cấp
          </Button>
        </div>

        {/* Bảng */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={data?.suppliers || data?.data || []}
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
            showTotal={(total) => `Tổng ${total} nhà cung cấp`}
          />
        </div>
      </div>

      {/* Modal thêm / sửa */}
      <Modal
        title={editingSupplier ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
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
                label="Tên nhà cung cấp"
                rules={[{ required: true, message: "Nhập tên nhà cung cấp" }]}
              >
                <Input
                  placeholder="Nhập tên nhà cung cấp"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Mô tả nhà cung cấp" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Suppliers;