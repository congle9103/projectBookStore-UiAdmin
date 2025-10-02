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
  Popconfirm,
  message,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import type { ICategory } from "../types/catrgory.type";
// Query key type
type QueryKey = [string, { category?: string }];

// Fetch categories
const fetchCategories = async ({ queryKey }: { queryKey: QueryKey }) => {
  const [, { category }] = queryKey;
  const res = await axios.get(
    "https://projectbookstore-backendapi.onrender.com/api/v1/categories",
    { params: { category } }
  );
  return res.data;
};

const Categories = () => {
  const [category, setCategory] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["categories", { category }],
    queryFn: fetchCategories,
  });

  // === Add or Update Category ===
  const handleSaveCategory = async () => {
    try {
      const values = await form.validateFields();

      if (editingCategory) {
        // Update
        await axios.put(
          `https://projectbookstore-backendapi.onrender.com/api/v1/categories/${editingCategory._id}`,
          values
        );
        message.success("Cập nhật thể loại thành công");
      } else {
        // Create
        await axios.post(
          "https://projectbookstore-backendapi.onrender.com/api/v1/categories",
          values
        );
        message.success("Thêm thể loại thành công");
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra khi lưu thể loại");
    }
  };

  // === Edit ===
  const handleEdit = (record: ICategory) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // === Delete ===
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(
        `https://projectbookstore-backendapi.onrender.com/api/v1/categories/${id}`
      );
      message.success("Xóa thể loại thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra khi xóa thể loại");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Tên thể loại",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => desc || <Tag color="orange">Chưa có</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (record: ICategory) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record._id!)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) return <Spin tip="Đang tải thể loại..." />;
  if (isError) return <Alert type="error" message={(error as Error).message} />;

  return (
    <div>
      <main className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          {/* Header filter */}
          <div className="flex items-center mb-4 gap-6">
            <h3 className="text-lg font-semibold w-48">Danh sách thể loại:</h3>

            <Select
              placeholder="Lọc theo thể loại"
              className="
                !w-40
                [&_.ant-select-selector]:!border-gray-600
                [&_.ant-select-selector]:!font-semibold
                [&_.ant-select-selection-placeholder]:!font-semibold
                [&_.ant-select-selection-placeholder]:!text-gray-600
              "
              value={category}
              onChange={(value) => setCategory(value)}
              options={[
                { value: "", label: "Tất cả thể loại" },
                { value: "van-hoc", label: "Văn học" },
                { value: "tam-ly-ky-nang", label: "Tâm lý kỹ năng" },
                { value: "lich-su-viet-nam", label: "Lịch sử Việt Nam" },
                { value: "truyen-tranh", label: "Truyện tranh" },
                { value: "thieu-nhi", label: "Thiếu nhi" },
                { value: "ngoai-van", label: "Ngoại văn" },
                { value: "sach-hoc-ngoai-ngu", label: "Sách học ngoại ngữ" },
              ]}
            />

            <Button
              type="primary"
              onClick={() => {
                setIsModalOpen(true);
                setEditingCategory(null);
                form.resetFields();
              }}
              className="ml-auto"
            >
              Add Category
            </Button>
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={Array.isArray(categories?.data) ? categories.data : []}
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </div>
      </main>

      {/* Modal Add/Edit Category */}
      <Modal
        title={editingCategory ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onOk={handleSaveCategory}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Tên thể loại"
                rules={[{ required: true, message: "Nhập tên thể loại" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="slug"
                label="Slug"
                rules={[{ required: true, message: "Nhập slug" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
