import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

const StudentLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <Sidebar role="student" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default StudentLayout;
