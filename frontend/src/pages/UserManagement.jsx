import React from "react";
import Navbar from "../components/Navbar";

function UserManagement() {
  const users = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@gmail.com",
      role: "Admin",
    },
    {
      id: 2,
      name: "Traffic Officer",
      email: "officer@gmail.com",
      role: "User",
    },
    {
      id: 3,
      name: "City Manager",
      email: "manager@gmail.com",
      role: "User",
    },
  ];

  return (
    <>
      <Navbar />

      <div
        style={{
          padding: "30px",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <h1>User Management</h1>

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            width="100%"
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default UserManagement;
