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
  city,
  is_active,
}: {
  page?: number;
  limit?: number;
  sort_type?: string;
  keyword?: string;
  city?: string;
  is_active?: string;
}) => {
  const params: any = { page, limit };
  if (keyword) params.keyword = keyword;
  if (sort_type) params.sort_type = sort_type;
  if (city) params.city = city;
  if (is_active) params.is_active = is_active;

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
  const city = searchParams.get("city") || "";
  const is_active = searchParams.get("is_active") || "";

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
    queryKey: ["customers", page, limit, keyword, sort_type, city, is_active],
    queryFn: () =>
      fetchCustomers({ page, limit, keyword, sort_type, city, is_active }),
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
            className="!w-62 [&_.ant-btn]:!bg-blue-500 [&_.ant-btn]:!text-white"
          />

          <Select
            defaultValue={sort_type}
            style={{ width: 204 }}
            onChange={(value) => updateParams({ sort_type: value, page: 1 })}
            options={[
              { value: "desc", label: "Tổng chi tiêu: Cao → Thấp" },
              { value: "asc", label: "Tổng chi tiêu: Thấp → Cao" },
            ]}
          />

          <Search
            placeholder="Lọc theo thành phố"
            allowClear
            enterButton
            defaultValue={city}
            onSearch={(value) => updateParams({ city: value, page: 1 })}
            className="!w-52 [&_.ant-btn]:!bg-blue-500 [&_.ant-btn]:!text-white"
          />

          <Select
            defaultValue={searchParams.get("is_active") || ""}
            className="!w-26"
            onChange={(value) => updateParams({ is_active: value, page: 1 })}
            options={[
              { value: "", label: "Trạng thái" },
              { value: "true", label: "Hoạt động" },
              { value: "false", label: "Khoá" },
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
              {/* USERNAME */}
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  { required: true, message: "Vui lòng nhập tên đăng nhập" },
                  {
                    min: 3,
                    max: 20,
                    message: "Tên đăng nhập phải từ 3–20 ký tự",
                  },
                  {
                    pattern: /^(?![_.])(?!.*[_.]{2})[a-z0-9._]+(?<![_.])$/,
                    message:
                      "Tên đăng nhập không được bắt đầu/kết thúc bằng '.' hoặc '_' và không chứa ký tự đặc biệt",
                  },
                ]}
              >
                <Input disabled={!!editingCustomer} />
              </Form.Item>

              {/* PASSWORD */}
              {!editingCustomer && (
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu" },
                    {
                      min: 8,
                      message: "Mật khẩu phải có ít nhất 8 ký tự",
                    },
                    {
                      pattern:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message:
                        "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
                    },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              )}

              {/* FULL NAME */}
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[
                  { required: true, message: "Vui lòng nhập họ tên" },
                  {
                    min: 3,
                    max: 100,
                    message: "Họ tên phải từ 3–100 ký tự",
                  },
                ]}
              >
                <Input />
              </Form.Item>

              {/* EMAIL */}
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                  { max: 100, message: "Email tối đa 100 ký tự" },
                ]}
              >
                <Input disabled={!!editingCustomer} />
              </Form.Item>

              {/* PHONE */}
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^\d{10,15}$/,
                    message: "Số điện thoại phải từ 10–15 chữ số",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              {/* AVATAR */}
              <Form.Item name="avatar" label="Ảnh đại diện (URL)">
                <Input placeholder="https://..." />
              </Form.Item>

              {/* ADDRESS */}
              <Form.Item
                name="address"
                label="Địa chỉ"
                rules={[
                  { required: true, message: "Vui lòng nhập địa chỉ" },
                  { max: 255, message: "Địa chỉ tối đa 255 ký tự" },
                ]}
              >
                <Input />
              </Form.Item>

              {/* CITY */}
              <Form.Item
                name="city"
                label="Thành phố"
                rules={[
                  { required: true, message: "Vui lòng nhập thành phố" },
                  { max: 100, message: "Thành phố tối đa 100 ký tự" },
                ]}
              >
                <Input />
              </Form.Item>

              {/* DATE OF BIRTH */}
              <Form.Item
                name="date_of_birth"
                label="Ngày sinh"
                rules={[{ required: true, message: "Vui lòng chọn ngày sinh" }]}
              >
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>

              {/* GENDER */}
              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
              >
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="male">Nam</Select.Option>
                  <Select.Option value="female">Nữ</Select.Option>
                  <Select.Option value="other">Khác</Select.Option>
                </Select>
              </Form.Item>

              {/* POINT */}
              <Form.Item
                name="point"
                label="Điểm tích lũy"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "Điểm phải là số không âm",
                  },
                ]}
              >
                <Input disabled={!!editingCustomer} type="number" />
              </Form.Item>

              {/* IS_ACTIVE */}
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
