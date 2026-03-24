import "server-only";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Expert } from "../../shared/types";

type ExpertListProps = {
  experts: Expert[];
};

export function ExpertList({ experts }: ExpertListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        有識者一覧 ({experts.length}件)
      </h2>

      {experts.length === 0 ? (
        <p className="text-gray-500">登録された有識者がいません</p>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>所属</TableHead>
                <TableHead>登録日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experts.map((expert) => (
                <TableRow key={expert.id}>
                  <TableCell className="font-medium">{expert.name}</TableCell>
                  <TableCell>{expert.email}</TableCell>
                  <TableCell>{expert.affiliation}</TableCell>
                  <TableCell>
                    {new Date(expert.created_at).toLocaleDateString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
