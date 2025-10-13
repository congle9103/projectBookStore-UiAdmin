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
import type { IPublisher } from "../types/publisher.type";

const API_URL = `https://projectbookstore-backendapi.onrender.com/api/v1/publishers`;

// ========================================
// 🔹 FETCH PUBLISHERS
// ========================================
const fetchPublishers = async ({
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
  if (res.data?.data?.publishers) return res.data.data;
  return res.data.data || res.data;
};

// ========================================
// 🔹 CREATE PUBLISHER
// ========================================
const createPublisher = async (values: any) => {
  const payload = {
    name: values.name,
    description: values.description,
  };
  return axios.post(API_URL, payload);
};

// ========================================
// 🔹 UPDATE PUBLISHER
// ========================================
const updatePublisher = async (id: string, values: any) => {
  const payload = {
    name: values.name,
    description: values.description,
  };
  return axios.put(`${API_URL}/${id}`, payload);
};

// ========================================
// 🔹 DELETE PUBLISHER
// ========================================
const deletePublisher = async (id: string) => {
  return axios.delete(`${API_URL}/${id}`);
};

// ========================================
// 🔹 COMPONENT CHÍNH
// ========================================
const Publishers = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<IPublisher | null>(null);

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

  // Fetch publishers
  const { data, isError, error, isFetching } = useQuery({
    queryKey: ["publishers", page, limit, keyword],
    queryFn: () => fetchPublishers({ page, limit, keyword }),
  });

  // ========================================
  // 🔹 LƯU (CREATE / UPDATE)
  // ========================================
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingPublisher) {
        await updatePublisher(editingPublisher._id, values);
        message.success("Cập nhật nhà xuất bản thành công");
      } else {
        await createPublisher(values);
        message.success("Thêm nhà xuất bản thành công");
      }

      setIsModalOpen(false);
      setEditingPublisher(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
    } catch (err: any) {
      console.error(err);
      message.error(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu nhà xuất bản"
      );
    }
  };

  // ========================================
  // 🔹 EDIT
  // ========================================
  const handleEdit = (record: IPublisher) => {
    setEditingPublisher(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // ========================================
  // 🔹 DELETE
  // ========================================
  const handleDelete = async (id: string) => {
    try {
      await deletePublisher(id);
      message.success("Xóa nhà xuất bản thành công");
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
    } catch {
      message.error("Xóa nhà xuất bản thất bại");
    }
  };

  // ========================================
  // 🔹 CỘT BẢNG
  // ========================================
  const columns = [
    {
      title: "Tên nhà xuất bản",
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
      render: (record: IPublisher) => (
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
            Danh sách nhà xuất bản:
          </label>
          <Input.Search
            placeholder="Tìm nhà xuất bản..."
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
              setEditingPublisher(null);
              form.resetFields();
            }}
          >
            Thêm nhà xuất bản
          </Button>
        </div>

        {/* Bảng */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={data?.publishers || data?.data || []}
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
            showTotal={(total) => `Tổng ${total} nhà xuất bản`}
          />
        </div>
      </div>

      {/* Modal thêm / sửa */}
      <Modal
        title={editingPublisher ? "Chỉnh sửa nhà xuất bản" : "Thêm nhà xuất bản mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingPublisher(null);
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
                label="Tên nhà xuất bản"
                rules={[
                  { required: true, message: "Nhập tên nhà xuất bản" },
                  { min: 3, message: "Tên nhà xuất bản tối thiểu 3 ký tự" },
                  { max: 50, message: "Tên nhà xuất bản tối đa 50 ký tự" },
                  {
                    whitespace: true,
                    message:
                      "Tên nhà xuất bản không được chứa khoảng trắng đầu/cuối",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập tên nhà xuất bản"
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
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Mô tả nhà xuất bản" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Publishers;
