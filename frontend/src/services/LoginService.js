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
