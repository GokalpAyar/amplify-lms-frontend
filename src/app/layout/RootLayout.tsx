import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Outlet />
    </main>
  );
};

export default RootLayout;
