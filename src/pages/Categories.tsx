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
} from "antd";
import { useQuery } from "@tanstack/react-query";
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
    {
      params: { category },
    }
  );
  return res.data;
};

const Categories = () => {
  const [category, setCategory] = useState<string | undefined>();

  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["categories", { category }],
    queryFn: fetchCategories,
  });

  // State + Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddCategory = () => {
    form.validateFields().then((values) => {
      console.log("New category:", values);
      setIsModalOpen(false);
      form.resetFields();
      // TODO: axios.post("http://localhost:8080/api/v1/categories", values)
    });
  };

  const handleEdit = (id: string) => {
    console.log("Edit:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete:", id);
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
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
    },
    {
      title: "Action",
      key: "action",
      render: (record: ICategory) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record._id!)}>
            Edit
          </Button>
          <Button danger onClick={() => handleDelete(record._id!)}>
            Delete
          </Button>
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
                { value: "truyen-tranh", label: "Truyện tranh" },
                { value: "tam-ly-ky-nang", label: "Tâm lý kỹ năng" },
                { value: "thieu-nhi", label: "Thiếu nhi" },
                { value: "ngoai-van", label: "Ngoại văn" },
              ]}
            />

            <Button
              type="primary"
              onClick={() => setIsModalOpen(true)}
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

      {/* Modal Add Category */}
      <Modal
        title="Thêm thể loại mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddCategory}
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
