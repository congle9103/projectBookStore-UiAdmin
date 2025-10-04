import {
  Table,
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
  DatePicker,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";

type QueryKey = [string, { sort?: string; role?: string }];

interface Staff {
  _id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "admin" | "dev";
  salary?: number;
  hire_date?: string;
  is_active: boolean;
  createdAt: string;
}

// Fetch staffs
const fetchStaffs = async ({ queryKey }: { queryKey: QueryKey }) => {
  const [, { sort, role }] = queryKey;
  const res = await axios.get(
    "https://projectbookstore-backendapi.onrender.com/api/v1/staffs",
    { params: { sort, role } }
  );
  return res.data;
};

const Staffs = () => {
  const [sort, setSort] = useState<string | undefined>();
  const [role, setRole] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const {
    data: staffs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["staffs", { sort, role }],
    queryFn: fetchStaffs,
  });

  // Normalize text
  const normalizeText = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "");

  // CRUD Handlers
  const handleAddStaff = () => {
    form.validateFields().then((values) => {
      console.log("New staff:", values);
      setIsModalOpen(false);
      form.resetFields();
      // TODO: axios.post("/api/v1/staffs", values)
    });
  };

  const handleEdit = (id: string) => {
    console.log("Edit staff:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete staff:", id);
  };

  // Columns
  const columns = [
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      key: "username",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Họ và tên",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
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
        salary ? <span>{salary.toLocaleString()} đ</span> : "-",
    },
    {
      title: "Ngày tuyển dụng",
      dataIndex: "hire_date",
      key: "hire_date",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) =>
        active ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="gray">Khoá</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: Staff) => (
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

  if (isLoading) return <Spin tip="Đang tải danh sách nhân viên..." />;
  if (isError) return <Alert type="error" message={error.message} />;

  return (
    <div>
      <main className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center mb-4 gap-6">
            <h3 className="text-lg font-semibold w-44">Danh sách nhân viên:</h3>

            <Search
              placeholder="Tìm kiếm nhân viên"
              allowClear
              enterButton
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                !w-100
                [&_.ant-input-affix-wrapper]:!border-gray-500
                [&_.ant-input]:placeholder-gray-500
                [&_.ant-btn]:!bg-blue-500 [&_.ant-btn]:!text-white
                [&_.ant-btn]:hover:!bg-blue-700
              "
            />

            <Select
              placeholder="Sắp xếp theo lương"
              value={sort}
              onChange={(value) => setSort(value)}
              options={[
                { value: "", label: "Mặc định" },
                { value: "asc", label: "Thấp đến cao" },
                { value: "desc", label: "Cao đến thấp" },
              ]}
              className="!w-44 [&_.ant-select-selector]:!border-gray-600 [&_.ant-select-selector]:!font-semibold [&_.ant-select-selection-placeholder]:!font-semibold [&_.ant-select-selection-placeholder]:!text-gray-600"
            />

            <Select
              placeholder="Lọc theo vai trò"
              value={role}
              onChange={(value) => setRole(value)}
              options={[
                { value: "", label: "Tất cả" },
                { value: "admin", label: "Admin" },
                { value: "dev", label: "Dev" },
              ]}
              className="!w-40 [&_.ant-select-selector]:!border-gray-600 [&_.ant-select-selector]:!font-semibold [&_.ant-select-selection-placeholder]:!font-semibold [&_.ant-select-selection-placeholder]:!text-gray-600"
            />

            <Button
              type="primary"
              onClick={() => setIsModalOpen(true)}
              className="ml-auto"
            >
              Thêm nhân viên
            </Button>
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={
              Array.isArray(staffs?.data)
                ? staffs.data.filter((s: Staff) =>
                    normalizeText(s.username + s.full_name + s.email).includes(
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

      {/* Modal Add Staff */}
      <Modal
        title="Thêm nhân viên mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddStaff}
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
                <Input />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: "Nhập mật khẩu" }]}
              >
                <Input.Password />
              </Form.Item>

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
                rules={[{ required: true, type: "email", message: "Nhập email hợp lệ" }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>

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
