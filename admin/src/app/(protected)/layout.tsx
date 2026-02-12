import type { ReactNode } from "react";
import { Home, User } from "lucide-react";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getCurrentAdmin } from "@/features/auth/lib/auth-server";
import { NavigationLinks } from "./layout/navigation-links";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  みらい議会 Admin
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{admin?.email}</span>
              </div>
              <LogoutButton />
            </div>
          </div>

          {/* Navigation */}
          <NavigationLinks />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
