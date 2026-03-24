import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function NotFound() {
  redirect(routes.home());
}
