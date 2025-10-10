export interface ICategory {
  _id?: string;            // id trong MongoDB
  name: string;            // tên thể loại
  description?: string;    // mô tả ngắn
  slug: string;            // slug url-friendly
  createdAt?: string;      // timestamp do mongoose tạo
  updatedAt?: string;      // timestamp do mongoose tạo
}