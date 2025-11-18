import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <Sidebar role="admin" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
