import LoginService from "../services/LoginService";

const handleLogin = (e) => {
  e.preventDefault();

  const result = LoginService.login(
    email,
    password
  );

  alert(result.message);
};
const LoginService = {
  login: (email, password) => {
    if (email === "admin@gmail.com" && password === "admin123") {
      return {
        success: true,
        message: "Login Successful"
      };
    }

    return {
      success: false,
      message: "Invalid Email or Password"
    };
  }
};

export default LoginService;
