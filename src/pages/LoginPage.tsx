import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";

// Validation schema
const schema = yup.object().shape({
  username: yup.string().required("Vui lòng nhập tên đăng nhập"),
  password: yup.string().required("Vui lòng nhập mật khẩu"),
});

type LoginFormInputs = {
  username: string;
  password: string;
};

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(schema),
  });

  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit = (data: LoginFormInputs) => {
    setLoginError(null);

    if (data.username === "admin" && data.password === "1") {
      navigate("/dashboard");
    } else {
      setLoginError("Tên đăng nhập hoặc mật khẩu không hợp lệ.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Đăng nhập</h2>

        {loginError && <p style={styles.errorBox}>{loginError}</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tên đăng nhập</label>
            <input
              type="text"
              {...register("username")}
              style={styles.input}
              placeholder="Nhập tên đăng nhập"
            />
            {errors.username && (
              <p style={styles.errorText}>{errors.username.message}</p>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input
              type="password"
              {...register("password")}
              style={styles.input}
              placeholder="Nhập mật khẩu"
            />
            {errors.password && (
              <p style={styles.errorText}>{errors.password.message}</p>
            )}
          </div>

          <button type="submit" style={styles.button}>
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

// CSS-in-JS
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f2f5",
  },
  card: {
    background: "#fff",
    padding: "32px",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "360px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: "24px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1890ff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
  },
  errorText: {
    color: "red",
    fontSize: "13px",
    marginTop: "4px",
  },
  errorBox: {
    backgroundColor: "#ffe1e1",
    color: "#c00",
    padding: "10px",
    marginBottom: "16px",
    borderRadius: "4px",
    fontSize: "14px",
  },
};

export default LoginPage;
