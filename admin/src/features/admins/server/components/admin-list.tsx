import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminItem } from "../../client/components/admin-item";
import type { Admin } from "../../shared/types";

type AdminListProps = {
  admins: Admin[];
  currentAdminId: string;
};

export function AdminList({ admins, currentAdminId }: AdminListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        管理者一覧 ({admins.length}件)
      </h2>

      {admins.length === 0 ? (
        <p className="text-gray-500">管理者がいません</p>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メールアドレス</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead>最終ログイン</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <AdminItem
                  key={admin.id}
                  admin={admin}
                  isCurrentUser={admin.id === currentAdminId}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
