import { useState } from 'react';

const mockUsers = [
  { id: 'u1', name: 'Alice', role: 'student' },
  { id: 'u2', name: 'Bob', role: 'teacher' },
  { id: 'u3', name: 'Charlie', role: 'student' },
];

const ManageUsers = () => {
  const [users, setUsers] = useState(mockUsers);
  const [newUser, setNewUser] = useState({ name: '', role: 'student' });

  const handleRoleChange = (id: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleAddUser = () => {
    if (!newUser.name.trim()) return;
    const newId = `u${Date.now()}`;
    setUsers((prev) => [...prev, { id: newId, ...newUser }]);
    setNewUser({ name: '', role: 'student' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>

      <div className="p-4 border rounded space-y-2 bg-gray-50">
        <h2 className="text-lg font-semibold">Add New User</h2>
        <input
          type="text"
          placeholder="Full name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          className="border rounded px-3 py-1 w-64"
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          className="border rounded px-2 py-1 ml-2"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleAddUser}
          className="ml-4 bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
          Add User
        </button>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Name</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="border px-4 py-2">{u.name}</td>
              <td className="border px-4 py-2">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleDelete(u.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsers;
