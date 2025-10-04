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
  DatePicker,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";

type QueryKey = [string, { sort?: string; city?: string }];

interface Customer {
  _id: string;
  username: string;
  full_name: string;
  avatar?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  point?: number;
  is_active: boolean;
  createdAt: string;
}

// Fetch customers
const fetchCustomers = async ({ queryKey }: { queryKey: QueryKey }) => {
  const [, { sort, city }] = queryKey;
  const res = await axios.get(
    "https://projectbookstore-backendapi.onrender.com/api/v1/customers",
    { params: { sort, city } }
  );
  return res.data;
};

const Customers = () => {
  const [sort, setSort] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const {
    data: customers,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["customers", { sort }],
    queryFn: fetchCustomers,
  });

  // Normalize text for search
  const normalizeText = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "");

  // CRUD Handlers
  const handleAddCustomer = () => {
    form.validateFields().then((values) => {
      console.log("New customer:", values);
      setIsModalOpen(false);
      form.resetFields();
      // TODO: axios.post("/api/v1/customers", values)
    });
  };

  const handleEdit = (id: string) => {
    console.log("Edit customer:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete customer:", id);
  };

  // Table columns
  const columns = [
    {
      title: "Ảnh đại diện",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar: string) =>
        avatar ? (
          <Image src={avatar} width={50} height={50} style={{ borderRadius: "50%" }} />
        ) : (
          <Tag color="gray">No Avatar</Tag>
        ),
    },
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
      title: "Thành phố",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Điểm tích lũy",
      dataIndex: "point",
      key: "point",
      render: (point: number) => <Tag color="blue">{point ?? 0}</Tag>,
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
      render: (record: Customer) => (
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

  if (isLoading) return <Spin tip="Đang tải danh sách khách hàng..." />;
  if (isError) return <Alert type="error" message={error.message} />;

  return (
    <div>
      <main className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          {/* Header filter */}
          <div className="flex items-center mb-4 gap-6">
            <h3 className="text-lg font-semibold w-56">Danh sách khách hàng:</h3>

            <Search
              placeholder="Tìm kiếm khách hàng"
              allowClear
              enterButton
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
              placeholder="Sắp xếp theo điểm"
              value={sort}
              onChange={(value) => setSort(value)}
              options={[
                { value: "", label: "Mặc định" },
                { value: "asc", label: "Thấp đến cao" },
                { value: "desc", label: "Cao đến thấp" },
              ]}
              className="!w-44 [&_.ant-select-selector]:!border-gray-600 [&_.ant-select-selector]:!font-semibold [&_.ant-select-selection-placeholder]:!font-semibold [&_.ant-select-selection-placeholder]:!text-gray-600"
            />

            <Button type="primary" onClick={() => setIsModalOpen(true)} className="ml-auto">
              Thêm khách hàng
            </Button> 
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={
              Array.isArray(customers?.data)
                ? customers.data.filter((c: Customer) =>
                    normalizeText(c.full_name + c.username + c.email).includes(
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

      {/* Modal Add Customer */}
      <Modal
        title="Thêm khách hàng mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddCustomer}
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

              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>

              <Form.Item name="gender" label="Giới tính">
                <Select
                  options={[
                    { value: "male", label: "Nam" },
                    { value: "female", label: "Nữ" },
                    { value: "other", label: "Khác" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="avatar" label="Ảnh đại diện (URL)">
                <Input />
              </Form.Item>

              <Form.Item name="address" label="Địa chỉ">
                <Input />
              </Form.Item>

              <Form.Item name="city" label="Thành phố">
                <Input />
              </Form.Item>

              <Form.Item name="date_of_birth" label="Ngày sinh">
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item name="point" label="Điểm tích lũy">
                <Input type="number" />
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

export default Customers;
