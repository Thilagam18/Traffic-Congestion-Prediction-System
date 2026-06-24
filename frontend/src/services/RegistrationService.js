const RegistrationService = {
  register: (user) => {
    return {
      success: true,
      message: "User Registered Successfully",
      data: user
    };
  }
};

export default RegistrationService;
