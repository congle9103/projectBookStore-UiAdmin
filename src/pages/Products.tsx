import {
  Table,
  Image,
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
  Checkbox,
  message,
  Popconfirm,
  Pagination,
  InputNumber,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Search from "antd/es/input/Search";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Product } from "../types/product.type";
import type { ICategory } from "../types/category.type";

const API_URL = `https://projectbookstore-backendapi.onrender.com/api/v1/products`;

// ========================================
// 🔹 HÀM FETCH SẢN PHẨM
// ========================================
const fetchProducts = async ({
  page = 1,
  limit = 5,
  keyword,
  sort_by,
  sort_type,
  cat_id,
}: {
  page?: number;
  limit?: number;
  keyword?: string;
  sort_by?: string;
  sort_type?: string;
  cat_id?: string;
}) => {
  const params: any = { page, limit };

  if (keyword) params.keyword = keyword;
  if (sort_by) params.sort_by = sort_by;
  if (sort_type) params.sort_type = sort_type;
  if (cat_id) params.cat_id = cat_id;

  const res = await axios.get(API_URL, { params });
  if (res.data?.data?.products) return res.data.data;
  return res.data.products ? res.data : res.data.data;
};

// ========================================
// 🔹 HÀM CREATE SẢN PHẨM
// ========================================
const createProduct = async (values: any) => {
  const payload = {
    // Không spread ...values trực tiếp nếu muốn tránh gửi trường thừa/không cần
    product_name: values.product_name,
    category_id: values.category_id,
    supplier: values.supplier,
    publisher: values.publisher,
    authors: values.authors
      ? values.authors.split(",").map((a: string) => a.trim())
      : [],
    pages: values.pages,
    publicationYear: values.publicationYear,
    format: values.format,
    dimensions: values.dimensions,
    weight: values.weight,
    thumbnails: values.thumbnails
      ? values.thumbnails.split(",").map((url: string) => url.trim())
      : [],
    originalPrice: values.originalPrice,
    discountPercent: values.discountPercent,
    stock: values.stock,
    slug:
      values.product_name
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || "",
    description: values.description,
    isNew: values.isNew,
    isPopular: values.isPopular,
    isFlashSale: values.isFlashSale,
  };

  const response = await axios.post(API_URL, payload);
  console.log("Create Response from Backend:", response.data); // Thêm log để thấy createdAt + updatedAt
  return response.data; // Trả về data đầy đủ để sử dụng nếu cần
};

// ========================================
// 🔹 HÀM UPDATE SẢN PHẨM
// ========================================
const updateProduct = async (id: string, values: any) => {
  const payload = {
    ...values,
    authors: values.authors
      ? values.authors.split(",").map((a: string) => a.trim())
      : [],
    thumbnails: values.thumbnails
      ? values.thumbnails.split(",").map((url: string) => url.trim())
      : [],
    slug:
      values.product_name
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || "",
    updatedAt: new Date().toISOString(),
  };

  return axios.put(`${API_URL}/${id}`, payload);
};

// ========================================
// 🔹 COMPONENT CHÍNH
// ========================================
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Lấy params từ URL
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const keyword = searchParams.get("keyword") || "";
  const sort_by = searchParams.get("sort_by") || "";
  const sort_type = searchParams.get("sort_type") || "";
  const cat_id = searchParams.get("cat_id") || "";

  // Gọi API React Query
  const { data, isError, error, isFetching } = useQuery({
    queryKey: ["products", page, limit, keyword, sort_by, sort_type, cat_id],
    queryFn: () =>
      fetchProducts({ page, limit, keyword, sort_by, sort_type, cat_id }),
  });

  console.log("data", data);
  

  // Hàm cập nhật params trên URL
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "https://projectbookstore-backendapi.onrender.com/api/v1/categories"
        );
        // ✅ Chuẩn hóa dữ liệu: chỉ lấy mảng thực tế
        const cats = res.data?.data?.categories;

        // Nếu cats không phải mảng, fallback rỗng
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        console.error("❌ Lỗi khi load categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // ========================================
  // 🔹 LƯU SẢN PHẨM (GỌI CREATE / UPDATE)
  // ========================================
  const handleSaveProduct = async () => {
    try {
      const values = await form.validateFields();

      if (editingProduct) {
        await updateProduct(editingProduct._id, values);
        console.log("Cập nhật sản phẩm:", values);
      } else {
        await createProduct(values);
        console.log("Thêm sản phẩm:", values);
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      console.error("❌ Lỗi khi lưu sản phẩm:", err);
      message.error(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu sản phẩm"
      );
    }
  };

  // Chỉnh sửa
  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue({
      ...record,
      authors: record.authors?.join(", "),
      thumbnails: record.thumbnails?.join(", "),
    });
    setIsModalOpen(true);
  };

  // Xóa
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      message.success("Xóa sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch {
      message.error("Xóa thất bại");
    }
  };

  // ========================================
  // 🔹 CỘT BẢNG
  // ========================================
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnails",
      key: "thumbnails",
      render: (thumbs: string[] | string) => {
        const thumb = Array.isArray(thumbs) ? thumbs[0] : thumbs;
        return (
          <Image
            src={
              thumb?.startsWith("http")
                ? thumb
                : `${import.meta.env.VITE_BACKEND_URL_STATIC}/${thumb}`
            }
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
        );
      },
    },
    { title: "Tên sản phẩm", dataIndex: "product_name", key: "product_name" },
    { title: "Danh mục", dataIndex: "category_name", key: "category_name" },
    {
      title: "Giá gốc",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (price: number) => `${price?.toLocaleString()} đ`,
    },
    {
      title: "Giảm giá",
      dataIndex: "discountPercent",
      key: "discountPercent",
      render: (percent: number) => (
        <Tag color={percent > 0 ? "green" : "red"}>{percent}%</Tag>
      ),
    },
    {
      title: "Giá hiện tại",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `${price?.toLocaleString()} đ`,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: Product) => (
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

  if (isError) return <Alert type="error" message={(error as Error).message} />;

  // ========================================
  // 🔹 UI
  // ========================================
  return (
    <div className="p-6">
      <div className="bg-white shadow-lg rounded-xl p-6">
        {/* Bộ lọc */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="text-lg font-semibold">Danh sách sản phẩm:</label>
          <Search
            placeholder="Tìm sản phẩm..."
            allowClear
            enterButton
            defaultValue={keyword}
            onSearch={(value) => updateParams({ keyword: value, page: 1 })}
            className="!w-100"
          />

          <Select
            placeholder="Thể loại"
            className="!w-40"
            value={cat_id || undefined}
            onChange={(value) => updateParams({ cat_id: value, page: 1 })}
            options={[
              { value: "", label: "Tất cả" },
              { value: "history", label: "Lịch sử" },
              { value: "novel", label: "Văn học" },
              { value: "comic", label: "Truyện tranh" },
              { value: "children", label: "Thiếu nhi" },
              { value: "skills", label: "Kỹ năng" },
              { value: "foreign", label: "Ngoại văn" },
            ]}
          />

          <Select
            placeholder="Sắp xếp theo giá"
            className="!w-48"
            value={sort_type || undefined}
            onChange={(value) =>
              updateParams({ sort_type: value, sort_by: "price" })
            }
            options={[
              { value: "asc", label: "Giá thấp → cao" },
              { value: "desc", label: "Giá cao → thấp" },
            ]}
          />

          <Button
            type="primary"
            className="ml-auto"
            onClick={() => {
              setIsModalOpen(true);
              setEditingProduct(null);
              form.resetFields();
            }}
          >
            Thêm sản phẩm
          </Button>
        </div>

        {/* Bảng */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={data?.products}
          loading={isFetching}
          pagination={false}
        />

        {/* Phân trang */}
        <div className="mt-4 text-right">
          <Pagination
            current={page}
            total={data?.totalRecords}
            pageSize={limit}
            onChange={(p) => updateParams({ page: p })}
            showTotal={
              data?.totalRecords
                ? (total) => `Tổng ${total} sản phẩm`
                : undefined
            }
          />
        </div>
      </div>

      {/* Modal Thêm / Sửa */}
      <Modal
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveProduct}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isNew: false,
            isPopular: false,
            isFlashSale: false,
          }}
        >
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="product_name"
                label="Tên sách"
                rules={[
                  { required: true, message: "Vui lòng nhập tên sách" },
                  {
                    min: 2,
                    message: "Tên sản phẩm quá ngắn (tối thiểu 2 ký tự)",
                  },
                  { max: 255, message: "Tên sản phẩm tối đa 255 ký tự" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const isDuplicate = data?.products?.some(
                        (p) =>
                          p.product_name.trim().toLowerCase() ===
                            value.trim().toLowerCase() &&
                          p._id !== editingProduct?._id // bỏ qua sản phẩm đang sửa
                      );
                      return isDuplicate
                        ? Promise.reject("Tên sản phẩm đã tồn tại")
                        : Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Nhập tên sách"
                  onChange={(e) => {
                    const name = e.target.value;
                    form.setFieldsValue({
                      slug: name
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, ""),
                    });
                  }}
                />
              </Form.Item>

              <Form.Item
                name="slug"
                label="Slug"
                rules={[
                  { required: true, message: "Vui lòng nhập slug" },
                  {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: "Slug chỉ chứa chữ thường, số và dấu gạch ngang",
                  },
                ]}
              >
                <Input placeholder="vd: vu-tru-trong-hat-cat" />
              </Form.Item>

              <Form.Item
                name="category_id"
                label="Danh mục"
                rules={[{ required: true, message: "Chọn danh mục" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  options={categories.map((cat) => ({
                    value: cat._id,
                    label: cat.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="authors"
                label="Tác giả"
                rules={[
                  { required: true, message: "Nhập ít nhất 1 tác giả" },
                  {
                    min: 2,
                    message: "Tên tác giả quá ngắn (tối thiểu 2 ký tự)",
                  },
                  { max: 255, message: "Tên tác giả tối đa 255 ký tự" },
                ]}
              >
                <Input placeholder="Nhập tên tác giả, cách nhau bằng dấu phẩy" />
              </Form.Item>

              <Form.Item
                name="publisher"
                label="Nhà xuất bản"
                rules={[
                  { required: true, message: "Nhập nhà xuất bản" },
                  { min: 2, message: "Tên quá ngắn" },
                  { max: 255, message: "Tên tối đa 255 ký tự" },
                ]}
              >
                <Input placeholder="VD: NXB Khoa học" />
              </Form.Item>

              <Form.Item
                name="supplier"
                label="Nhà cung cấp"
                rules={[
                  { required: true, message: "Nhập nhà cung cấp" },
                  { min: 2, message: "Tên quá ngắn" },
                  { max: 255, message: "Tên tối đa 255 ký tự" },
                ]}
              >
                <Input placeholder="VD: Fahasa" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Mô tả"
                rules={[{ max: 5000, message: "Mô tả tối đa 5000 ký tự" }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Mô tả ngắn về nội dung sách"
                />
              </Form.Item>
            </Col>

            {/* Cột phải */}
            <Col span={12}>
              <Form.Item
                name="originalPrice"
                label="Giá gốc (VNĐ)"
                rules={[
                  { required: true, message: "Nhập giá gốc" },
                  { type: "number", min: 0, message: "Giá phải ≥ 0" },
                ]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="discountPercent"
                label="Giảm giá (%)"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    max: 90,
                    message: "Giảm giá 0–90%",
                  },
                ]}
              >
                <InputNumber min={0} max={90} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="price"
                label="Giá sau giảm (VNĐ)"
                rules={[{ type: "number", min: 0, message: "Giá phải ≥ 0" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="stock"
                label="Tồn kho"
                rules={[
                  { required: true, message: "Nhập tồn kho" },
                  { type: "number", min: 0, message: "Tồn kho ≥ 0" },
                ]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="publicationYear"
                label="Năm xuất bản"
                rules={[
                  {
                    required: true,
                    type: "number",
                    min: 1900,
                    max: new Date().getFullYear(),
                    message: `Năm xuất bản từ 1900 đến ${new Date().getFullYear()}`,
                  },
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="pages"
                label="Số trang"
                rules={[
                  {
                    required: true,
                    type: "number",
                    min: 50,
                    max: 3000,
                    message: "Từ 50–3000 trang",
                  },
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="format"
                label="Định dạng"
                rules={[{ required: true, message: "Chọn định dạng hợp lệ" }]}
              >
                <Select
                  options={[
                    { value: "Bìa mềm", label: "Bìa mềm" },
                    { value: "Bìa cứng", label: "Bìa cứng" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="dimensions"
                label="Kích thước"
                rules={[
                  {
                    pattern: /^[0-9]+x[0-9]+x[0-9]+(cm|mm)?$/,
                    message: "Định dạng: rộngxcaoxdày (vd: 15x23x3cm)",
                  },
                ]}
              >
                <Input placeholder="15x23x3cm" />
              </Form.Item>

              <Form.Item
                name="weight"
                label="Trọng lượng (gram)"
                rules={[
                  {
                    type: "number",
                    min: 100,
                    max: 5000,
                    message: "100–5000 gram",
                  },
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="thumbnails"
                label="Ảnh (URL)"
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const urls = value.split(",").map((u) => u.trim());
                      const isValid = urls.every((url) =>
                        /^(http|https):\/\/[^ "]+$/.test(url)
                      );
                      return isValid
                        ? Promise.resolve()
                        : Promise.reject(
                            "Mỗi ảnh phải là URL hợp lệ (http/https)"
                          );
                    },
                  },
                ]}
              >
                <Input placeholder="Nhập hoặc dán link ảnh (nhiều link cách nhau bằng dấu phẩy)" />
              </Form.Item>

              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item name="isNew" valuePropName="checked">
                    <Checkbox>Mới</Checkbox>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="isPopular" valuePropName="checked">
                    <Checkbox>Phổ biến</Checkbox>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="isFlashSale" valuePropName="checked">
                    <Checkbox>Flash Sale</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
