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
import {
  useQuery,
  useQueryClient,
  type QueryFunction,
} from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useState } from "react";
import type {
  Order,
  OrderQueryParams,
  OrderResponse,
} from "../types/order.type";

// Fetch Orders
const fetchOrders: QueryFunction<
  OrderResponse,
  [string, OrderQueryParams]
> = async ({ queryKey }) => {
  const [, { status, startDate, endDate, search }] = queryKey;

  // Chỉ giữ lại param nào có giá trị thật sự
  const params: Record<string, unknown> = {};
  if (status && status.trim() !== "") params.status = status;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (search && search.trim() !== "") params.search = search;

  const res = await axios.get<OrderResponse>(
    "https://projectbookstore-backendapi.onrender.com/api/v1/orders",
    { params }
  );
  return res.data;
};

const Orders = () => {
  const [status, setStatus] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState(""); // search realtime
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [startDateInput, setStartDateInput] = useState<string | undefined>();
  const [endDateInput, setEndDateInput] = useState<string | undefined>();

  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const {
    data: orders,
    isError,
    error,
    isFetching,
  } = useQuery<OrderResponse, Error, OrderResponse, [string, OrderQueryParams]>(
    {
      queryKey: ["orders", { status, startDate, endDate, search: searchTerm }],
      queryFn: fetchOrders,
    }
  );

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

  const columns = [
    {
      title: "Khách hàng",
      dataIndex: ["customer", "full_name"],
      key: "customer",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Sdt khách hàng",
      key: "phone",
      render: (record) => {
        if (record.customer) {
          return record.customer.phone;
        } else if (record.staff) {
          return record.staff.phone;
        }
        return "-";
      },
    },
    {
      title: "Nhân viên",
      dataIndex: ["staff", "full_name"],
      key: "staff",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
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

        const viStatus: Record<string, string> = {
          pending: "Chờ xử lý",
          processing: "Đang xử lý",
          shipping: "Đang giao",
          completed: "Hoàn thành",
          cancelled: "Đã hủy",
        };

        return <Tag color={colors[status]}>{viStatus[status] || status}</Tag>;
      },
    },
    {
      title: "Phương thức thanh toán",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (method: string) => method.replace(/_/g, " ").toUpperCase(),
    },
    {
      title: "Ngày mua",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour12: false,
        });
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount: number) => <span>{amount.toLocaleString()} đ</span>,
    },
    {
      title: "Thao tác",
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
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa đơn hàng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isError) return <Alert type="error" message={(error as Error).message} />;

  return (
    <div>
      <div className="p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center mb-4 gap-6 flex-wrap">
            <h3 className="text-lg font-semibold w-44">Danh sách đơn hàng:</h3>

            <Search
              placeholder="Tìm theo tên khách hàng, nhân viên"
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)} // gọi API ngay khi nhập
              value={searchTerm}
              className="!w-74"
            />

            <Select
              placeholder="Lọc theo trạng thái"
              className="!w-40"
              value={status}
              onChange={(value) => setStatus(value || undefined)} // nếu "" → set undefined
              options={[
                { value: "", label: "Tất cả" },
                { value: "pending", label: "Chờ xử lý" },
                { value: "processing", label: "Đang xử lý" },
                { value: "shipping", label: "Đang giao" },
                { value: "completed", label: "Hoàn thành" },
                { value: "cancelled", label: "Đã hủy" },
              ]}
            />

            {/* Bộ lọc theo thời gian */}
            <label> Từ ngày: </label>
            <Input
              type="date"
              placeholder="Từ ngày"
              style={{ width: 130 }}
              value={startDateInput /* state string 'YYYY-MM-DD' */}
              onChange={(e) => {
                const v = e.target.value;
                setStartDateInput(v);
                if (v) {
                  const iso = new Date(`${v}T00:00:00+07:00`).toISOString();
                  setStartDate(iso);
                } else setStartDate(undefined);
              }}
            />

            <label> Đến ngày: </label>
            <Input
              type="date"
              placeholder="Đến ngày"
              style={{ width: 130 }}
              value={endDateInput /* state string 'YYYY-MM-DD' */}
              onChange={(e) => {
                const v = e.target.value;
                setEndDateInput(v);
                if (v) {
                  const iso = new Date(`${v}T23:59:59+07:00`).toISOString();
                  setEndDate(iso);
                } else setEndDate(undefined);
              }}
            />
          </div>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={orders?.data || []} // BE đã lọc sẵn
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
      </div>

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
              <Descriptions.Item label="Sdt khách hàng">
                {selectedOrder.customer?.phone}
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
