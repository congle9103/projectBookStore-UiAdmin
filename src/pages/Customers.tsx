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
  message,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import dayjs from "dayjs";
import type { Customer } from "../types/customer.type";

type QueryKey = [string, { sort_type?: string; keyword?: string }];

const API_URL = "https://projectbookstore-backendapi.onrender.com/api/v1/customers";

// =============== FETCH LIST ===============
const fetchCustomers = async ({ queryKey }: { queryKey: QueryKey }) => {
  const [, { sort_type, keyword }] = queryKey;
  const res = await axios.get(API_URL, { params: { sort_type, keyword } });
  return res.data.data;
};

const Customers = () => {
  const queryClient = useQueryClient();

  const [sort_type, setSortType] = useState<string>("desc");
  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  const {
    data: customers,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["customers", { sort_type, keyword }],
    queryFn: fetchCustomers,
  });

  // =============== CRUD MUTATIONS ===============
  const addMutation = useMutation({
    mutationFn: (data: any) => axios.post(API_URL, data),
    onSuccess: () => {
      message.success("Thêm khách hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsModalOpen(false);
    },
    onError: () => message.error("Lỗi khi thêm khách hàng!"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => axios.put(`${API_URL}/${data._id}`, data),
    onSuccess: () => {
      message.success("Cập nhật khách hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsModalOpen(false);
    },
    onError: () => message.error("Lỗi khi cập nhật khách hàng!"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${API_URL}/${id}`),
    onSuccess: () => {
      message.success("Đã xoá khách hàng!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: () => message.error("Lỗi khi xoá khách hàng!"),
  });

  // =============== HANDLERS ===============
  const handleAddOrEdit = () => {
    form.validateFields().then((values) => {
      if (values.date_of_birth) {
        values.date_of_birth = dayjs(values.date_of_birth).toISOString();
      }
      if (editingCustomer) {
        updateMutation.mutate({ ...editingCustomer, ...values });
      } else {
        addMutation.mutate(values);
      }
    });
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    setIsModalOpen(true);
    form.setFieldsValue({
      ...record,
      date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth) : null,
    });
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xoá khách hàng này?",
      okType: "danger",
      onOk: () => deleteMutation.mutate(id),
    });
  };

  // =============== TABLE COLUMNS ===============
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar: string) =>
        avatar ? (
          <Image src={avatar} width={50} height={50} style={{ borderRadius: "50%" }} />
        ) : (
          <Tag color="gray">No Avatar</Tag>
        ),
    },
    { title: "Tên đăng nhập", dataIndex: "username", key: "username" },
    { title: "Họ và tên", dataIndex: "full_name", key: "full_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Điện thoại", dataIndex: "phone", key: "phone" },
    { title: "Thành phố", dataIndex: "city", key: "city" },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (val: number) => (
        <Tag color="purple">{val ? val.toLocaleString("vi-VN") + " ₫" : "0 ₫"}</Tag>
      ),
      sorter: (a: Customer, b: Customer) => (a.totalSpent || 0) - (b.totalSpent || 0),
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
      render: (point: number) => <Tag color="blue">{point ?? 0}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) =>
        active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Khoá</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: Customer) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button danger onClick={() => handleDelete(record._id)}>
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  if (isLoading) return <Spin tip="Đang tải danh sách khách hàng..." />;
  if (isError) return <Alert type="error" message={String(error)} />;

  // =============== RENDER ===============
  return (
    <div>
      <main className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center mb-4 gap-6">
            <h3 className="text-lg font-semibold w-56">Danh sách khách hàng</h3>

            <Search
              placeholder="Tìm theo họ tên hoặc sdt"
              allowClear
              enterButton
              onSearch={(value) => setKeyword(value)}
              className="!w-80 [&_.ant-btn]:!bg-blue-500 [&_.ant-btn]:!text-white"
            />

            <Button
              type="primary"
              onClick={() => {
                setEditingCustomer(null);
                setIsModalOpen(true);
                form.resetFields();
              }}
              className="ml-auto"
            >
              Thêm khách hàng
            </Button>
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={customers || []}
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </div>
      </main>

      {/* Modal Add/Edit */}
      <Modal
        title={editingCustomer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
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
                <Input disabled={!!editingCustomer} />
              </Form.Item>

              {!editingCustomer && (
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
                rules={[{ required: true, type: "email", message: "Nhập email hợp lệ" }]}
              >
                <Input disabled={!!editingCustomer} />
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
