import {
  Table,
  Image,
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
import type { Customer } from "../types/customer.type";

const API_URL =
  "https://projectbookstore-backendapi.onrender.com/api/v1/customers";

// =============== FETCH LIST ===============
const fetchCustomers = async ({
  page = 1,
  limit = 5,
  sort_type,
  keyword,
}: {
  page?: number;
  limit?: number;
  sort_type?: string;
  keyword?: string;
}) => {
  const params: any = { page, limit };
  if (keyword) params.keyword = keyword;
  if (sort_type) params.sort_type = sort_type;

  const res = await axios.get(API_URL, { params });
  return res.data.data;
};

const Customers = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // ==============================
  // 📌 DÙNG URL PARAMS GIỐNG PRODUCTS
  // ==============================
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const keyword = searchParams.get("keyword") || "";
  const sort_type = searchParams.get("sort_type") || "desc";

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
    data: customersData,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["customers", page, limit, keyword, sort_type],
    queryFn: () => fetchCustomers({ page, limit, keyword, sort_type }),
  });

  const customers = customersData || [];

  // ==============================
  // 🔹 MUTATIONS
  // ==============================
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

  // ==============================
  // 🔹 HANDLERS
  // ==============================
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
    if (id) deleteMutation.mutate(id);
  };

  // ==============================
  // 🔹 TABLE COLUMNS
  // ==============================
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar: string) =>
        avatar ? (
          <Image
            src={avatar}
            width={50}
            height={50}
            style={{ borderRadius: "50%" }}
          />
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
        <Tag color="purple">
          {val ? val.toLocaleString("vi-VN") + " ₫" : "0 ₫"}
        </Tag>
      ),
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
          <h3 className="text-lg font-semibold">Danh sách khách hàng:</h3>

          <Search
            placeholder="Tìm theo họ tên hoặc sdt"
            allowClear
            enterButton
            defaultValue={keyword}
            onSearch={(value) => updateParams({ keyword: value, page: 1 })}
            className="!w-80 [&_.ant-btn]:!bg-blue-500 [&_.ant-btn]:!text-white"
          />

          <Select
            defaultValue={sort_type}
            style={{ width: 220 }}
            onChange={(value) => updateParams({ sort_type: value, page: 1 })}
            options={[
              { value: "desc", label: "Tổng chi tiêu: Cao → Thấp" },
              { value: "asc", label: "Tổng chi tiêu: Thấp → Cao" },
            ]}
          />

          <Button
            type="primary"
            className="ml-auto"
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
              form.resetFields();
            }}
          >
            Thêm khách hàng
          </Button>
        </div>

        <Spin spinning={isFetching}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={customers}
            pagination={false}
          />
        </Spin>

        {/* Pagination */}
        <div className="mt-4 text-right">
          <Pagination
            current={page}
            total={customersData?.totalRecords || customers.length}
            pageSize={limit}
            onChange={(p) => updateParams({ page: p })}
            showTotal={(total) => `Tổng ${total} khách hàng`}
          />
        </div>
      </div>

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
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: "Nhập email hợp lệ",
                  },
                ]}
              >
                <Input disabled={!!editingCustomer} />
              </Form.Item>

              <Form.Item name="phone" label="Số điện thoại">
                <Input />
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
