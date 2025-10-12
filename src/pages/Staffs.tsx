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
  Checkbox,
  DatePicker,
  message,
  Pagination,
  Spin,
  Select,
  Popconfirm,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import type { Staff } from "../types/staff.type";

const API_URL =
  "https://projectbookstore-backendapi.onrender.com/api/v1/staffs";

// ===============================
// 📦 FETCH LIST STAFFS
// ===============================
const fetchStaffs = async ({
  page = 1,
  limit = 5,
  sort_type,
  sort_by,
  keyword,
}: {
  page?: number;
  limit?: number;
  sort_type?: string;
  sort_by?: string;
  keyword?: string;
}) => {
  const params: any = { page, limit };
  if (keyword) params.keyword = keyword;
  if (sort_type) params.sort_type = sort_type;
  if (sort_by) params.sort_by = sort_by;

  const res = await axios.get(API_URL, { params });
  return res.data.data;
};

const Staffs = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // ==============================
  // 📌 DÙNG URL PARAMS (phân trang & lọc)
  // ==============================
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const keyword = searchParams.get("keyword") || "";
  const sort_type = searchParams.get("sort_type") || "desc";
  const sort_by = searchParams.get("sort_by") || "updatedAt";

  const updateParams = (
    updates: Record<string, string | number | undefined>
  ) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") newParams.delete(key);
      else newParams.set(key, String(value));
    });
    setSearchParams(newParams);
  };

  // ==============================
  // 🔹 FETCH DATA
  // ==============================
  const {
  data: staffsData,
  isError,
  error,
  isFetching,
} = useQuery({
  queryKey: ["staffs", page, limit, keyword, sort_type, sort_by],
  queryFn: () => fetchStaffs({ page, limit, keyword, sort_type, sort_by }),
});

  console.log("staffData", staffsData);

  const staffs = staffsData?.data || [];

  // ==============================
  // 🔹 MUTATIONS
  // ==============================
  const addMutation = useMutation({
    mutationFn: (data: any) => axios.post(API_URL, data),
    onSuccess: () => {
      message.success("Thêm nhân viên thành công!");
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      setIsModalOpen(false);
    },
    onError: () => message.error("Lỗi khi thêm nhân viên!"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => axios.put(`${API_URL}/${data._id}`, data),
    onSuccess: () => {
      message.success("Cập nhật nhân viên thành công!");
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      setIsModalOpen(false);
    },
    onError: () => message.error("Lỗi khi cập nhật nhân viên!"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${API_URL}/${id}`),
    onSuccess: () => {
      message.success("Đã xoá nhân viên!");
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
    },
    onError: () => message.error("Lỗi khi xoá nhân viên!"),
  });

  // ==============================
  // 🔹 HANDLERS
  // ==============================
  const handleAddOrEdit = () => {
    form.validateFields().then((values) => {
      if (values.hire_date) {
        values.hire_date = dayjs(values.hire_date).toISOString();
      }
      if (editingStaff) {
        updateMutation.mutate({ ...editingStaff, ...values });
      } else {
        addMutation.mutate(values);
      }
    });
  };

  const handleEdit = (record: Staff) => {
    setEditingStaff(record);
    setIsModalOpen(true);
    form.setFieldsValue({
      ...record,
      hire_date: record.hire_date ? dayjs(record.hire_date) : null,
    });
  };

  const handleDelete = (id: string) => {
    if (id) deleteMutation.mutate(id);
  };

  // ==============================
  // 🔹 TABLE COLUMNS
  // ==============================
  const columns = [
    { title: "Tên đăng nhập", dataIndex: "username", key: "username" },
    { title: "Họ và tên", dataIndex: "full_name", key: "full_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) =>
        role === "admin" ? (
          <Tag color="red">Admin</Tag>
        ) : (
          <Tag color="blue">Dev</Tag>
        ),
    },
    {
      title: "Lương (VNĐ)",
      dataIndex: "salary",
      key: "salary",
      render: (salary: number) =>
        salary ? (
          <Tag color="purple">{salary.toLocaleString("vi-VN")} ₫</Tag>
        ) : (
          "0 ₫"
        ),
    },
    {
      title: "Ngày tuyển dụng",
      dataIndex: "hire_date",
      key: "hire_date",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) =>
        active ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="red">Khoá</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: Staff) => (
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

  // ==============================
  // 🔹 UI
  // ==============================
  if (isError)
    return <Alert type="error" message={(error as Error).message} showIcon />;

  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold">Danh sách nhân viên:</h3>

          <Search
            placeholder="Tìm theo tên, email, sđt..."
            allowClear
            enterButton
            defaultValue={keyword}
            onSearch={(value) => updateParams({ keyword: value, page: 1 })}
            className="!w-80 [&_.ant-btn]:!bg-blue-500 [&_.ant-btn]:!text-white"
          />

          <Select
            placeholder="Sắp xếp theo lương"
            style={{ width: 220 }}
            value={sort_type || undefined}
            onChange={(value) =>
              updateParams({ sort_type: value, sort_by: "salary" })
            }
            options={[
              { value: "asc", label: "Lương thấp → cao" },
              { value: "desc", label: "Lương cao → thấp" },
            ]}
          />

          <Button
            type="primary"
            className="ml-auto"
            onClick={() => {
              setEditingStaff(null);
              setIsModalOpen(true);
              form.resetFields();
            }}
          >
            Thêm nhân viên
          </Button>
        </div>

        <Spin spinning={isFetching}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={staffs}
            pagination={false}
          />
        </Spin>

        {/* Pagination */}
        <div className="mt-4 text-right">
          <Pagination
            current={page}
            total={staffsData?.totalRecords || staffs.length}
            pageSize={limit}
            onChange={(p) => updateParams({ page: p })}
            showTotal={(total) => `Tổng ${total} nhân viên`}
          />
        </div>
      </div>

      {/* Modal Add/Edit */}
      <Modal
        title={editingStaff ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddOrEdit}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: "Nhập tên đăng nhập" }]}
              >
                <Input disabled={!!editingStaff} />
              </Form.Item>

              {!editingStaff && (
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: "Nhập mật khẩu" }]}
                >
                  <Input.Password />
                </Form.Item>
              )}

              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: "Nhập họ tên" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: "Nhập email hợp lệ",
                  },
                ]}
              >
                <Input disabled={!!editingStaff} />
              </Form.Item>

              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: "Chọn vai trò" }]}
              >
                <Select
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "dev", label: "Dev" },
                  ]}
                />
              </Form.Item>

              <Form.Item name="salary" label="Lương (VNĐ)">
                <Input type="number" />
              </Form.Item>

              <Form.Item name="hire_date" label="Ngày tuyển dụng">
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item name="is_active" valuePropName="checked">
                <Checkbox>Đang hoạt động</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Staffs;
