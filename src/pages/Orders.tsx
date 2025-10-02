import {
  Table,
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
  message,
  Popconfirm,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import type { Order, OrderResponse } from "../types/order.type";

// Fetch Orders
const fetchOrders = async ({ queryKey }: { queryKey: [string, { status?: string }] }) => {
  const [, { status }] = queryKey;
  const res = await axios.get<OrderResponse>(
    "https://projectbookstore-backendapi.onrender.com/api/v1/orders",
    { params: { status } }
  );
  return res.data;
};

const Orders = () => {
  const [status, setStatus] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const {
    data: orders,
    isError,
    error,
    isFetching,
  } = useQuery<OrderResponse>({
    queryKey: ["orders", { status }],
    queryFn: fetchOrders,
    keepPreviousData: true,
  });

  // Save Order (edit only, add order thường làm ở backend checkout)
  const handleSaveOrder = async () => {
    try {
      const values = await form.validateFields();
      if (editingOrder) {
        await axios.put(
          `https://projectbookstore-backendapi.onrender.com/api/v1/orders/${editingOrder._id}`,
          values
        );
        message.success("Cập nhật đơn hàng thành công");
      }
      setIsModalOpen(false);
      setEditingOrder(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err instanceof Error) {
        message.error(err.message);
      } else {
        message.error("Có lỗi xảy ra khi lưu đơn hàng");
      }
    }
  };

  const handleEdit = (record: Order) => {
    setEditingOrder(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(
        `https://projectbookstore-backendapi.onrender.com/api/v1/orders/${id}`
      );
      message.success("Xóa đơn hàng thành công");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra khi xóa đơn hàng");
    }
  };

  const normalizeText = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, "");

  const columns = [
    {
      title: "Khách hàng",
      dataIndex: ["customer", "name"],
      key: "customer",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Nhân viên",
      dataIndex: ["staff", "name"],
      key: "staff",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Người nhận",
      dataIndex: "recipient_name",
      key: "recipient_name",
    },
    { title: "Điện thoại", dataIndex: "recipient_phone", key: "recipient_phone" },
    { title: "Thành phố", dataIndex: "city", key: "city" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: "orange",
          processing: "blue",
          shipping: "purple",
          completed: "green",
          cancelled: "red",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount: number) => <span>{amount.toLocaleString()} đ</span>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (record: Order) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa đơn hàng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isError) return <Alert type="error" message={(error as Error).message} />;

  return (
    <div>
      <main className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center mb-4 gap-6">
            <h3 className="text-lg font-semibold w-48">Danh sách đơn hàng:</h3>

            <Search
              placeholder="Tìm theo tên khách / người nhận"
              allowClear
              enterButton
              onChange={(e) => setSearchTerm(e.target.value)}
              className="!w-120"
            />

            <Select
              placeholder="Lọc theo trạng thái"
              className="!w-40"
              value={status}
              onChange={(value) => setStatus(value)}
              options={[
                { value: "", label: "Tất cả" },
                { value: "pending", label: "Chờ xử lý" },
                { value: "processing", label: "Đang xử lý" },
                { value: "shipping", label: "Đang giao" },
                { value: "completed", label: "Hoàn thành" },
                { value: "cancelled", label: "Đã hủy" },
              ]}
            />
          </div>

          <Table
            rowKey="_id"
            columns={columns}
            dataSource={
              Array.isArray(orders?.data)
                ? orders.data.filter(
                    (o: Order) =>
                      normalizeText(o.customer?.name || "").includes(
                        normalizeText(searchTerm)
                      ) ||
                      normalizeText(o.recipient_name).includes(
                        normalizeText(searchTerm)
                      )
                  )
                : []
            }
            pagination={{ pageSize: 5 }}
            loading={isFetching}
            scroll={{ x: true }}
          />
        </div>
      </main>

      {/* Modal Edit Order */}
      <Modal
        title="Chỉnh sửa đơn hàng"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        onOk={handleSaveOrder}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select
                  options={[
                    { value: "pending", label: "Chờ xử lý" },
                    { value: "processing", label: "Đang xử lý" },
                    { value: "shipping", label: "Đang giao" },
                    { value: "completed", label: "Hoàn thành" },
                    { value: "cancelled", label: "Đã hủy" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_method" label="Thanh toán">
                <Select
                  options={[
                    { value: "cash_on_delivery", label: "COD" },
                    { value: "zalopay", label: "ZaloPay" },
                    { value: "vnpay", label: "VNPay" },
                    { value: "shopeepay", label: "ShopeePay" },
                    { value: "momo", label: "Momo" },
                    { value: "atm", label: "ATM" },
                    { value: "visa", label: "Visa" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
