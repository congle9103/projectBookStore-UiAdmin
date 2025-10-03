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
  Descriptions,
  List,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import type { Order, OrderResponse } from "../types/order.type";
import { set } from "react-hook-form";

// Fetch Orders
const fetchOrders = async ({
  queryKey,
}: {
  queryKey: [
    string,
    { status?: string; minAmount?: number; maxAmount?: number }
  ];
}) => {
  const [, { status, minAmount, maxAmount }] = queryKey;
  const res = await axios.get<OrderResponse>(
    "https://projectbookstore-backendapi.onrender.com/api/v1/orders",
    {
      params: { status, minAmount, maxAmount },
    }
  );
  return res.data;
};

const Orders = () => {
  const [status, setStatus] = useState<string | undefined>();
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const {
    data: orders,
    isError,
    error,
    isFetching,
  } = useQuery<OrderResponse>({
    queryKey: ["orders", { status, minAmount, maxAmount }],
    queryFn: fetchOrders,
    keepPreviousData: true,
  });

  // Save Order (edit only)
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
    setIsDetailModalOpen(false);
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
      dataIndex: ["customer", "full_name"],
      key: "customer",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Nhân viên",
      dataIndex: ["staff", "full_name"],
      key: "staff",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    { title: "Người nhận", dataIndex: "recipient_name", key: "recipient_name" },
    {
      title: "Điện thoại",
      dataIndex: "recipient_phone",
      key: "recipient_phone",
    },
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
          <Button
            type="primary"
            onClick={(e) => {
              handleEdit(record);
              e.stopPropagation(); // Ngăn click lan ra row
            }}
          >
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
              className="!w-100"
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

            <Input
              type="text"
              placeholder="Min Amount"
              style={{ width: 140 }}
              value={minAmount?.toLocaleString("vi-VN") || ""}
              onChange={(e) => {
                const rawValue = e.target.value
                  .replace(/,/g, "")
                  .replace(/\./g, "");
                setMinAmount(rawValue ? Number(rawValue) : undefined);
              }}
            />

            <Input
              type="text"
              placeholder="Max Amount"
              style={{ width: 140 }}
              value={maxAmount?.toLocaleString("vi-VN") || ""}
              onChange={(e) => {
                const rawValue = e.target.value
                  .replace(/,/g, "")
                  .replace(/\./g, "");
                setMaxAmount(rawValue ? Number(rawValue) : undefined);
              }}
            />
          </div>

          <Table
            rowKey="_id"
            columns={columns}
            dataSource={
              Array.isArray(orders?.data)
                ? orders.data.filter(
                    (o: Order) =>
                      normalizeText(o.customer?.full_name || "").includes(
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
            onRow={(record) => ({
              onClick: () => {
                setSelectedOrder(record);
                setIsDetailModalOpen(true);
              },
              style: { cursor: "pointer" },
            })}
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
                  disabled={
                    editingOrder?.status === "completed" ||
                    editingOrder?.status === "cancelled"
                  }
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
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chi tiết đơn hàng */}
      <Modal
        title={`Chi tiết đơn hàng #${selectedOrder?._id}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.customer?.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên">
                {selectedOrder.staff?.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Người nhận">
                {selectedOrder.recipient_name}
              </Descriptions.Item>
              <Descriptions.Item label="Điện thoại">
                {selectedOrder.recipient_phone}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedOrder.shipping_address}, {selectedOrder.city}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag>{selectedOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {selectedOrder.payment_method}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền" span={2}>
                {selectedOrder.total_amount.toLocaleString()} đ
              </Descriptions.Item>
              {selectedOrder.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedOrder.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <h4 className="mt-4 mb-2 font-semibold">Danh sách sản phẩm:</h4>
            <List
              dataSource={selectedOrder.items}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <span>
                      {item.product?.product_name} x {item.quantity}
                    </span>
                    <span>{item.total.toLocaleString()} đ</span>
                  </div>
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
