import ChangePasswordForm from "@/components/change-password-form";
import { changeTemporaryPassword } from "../actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ChangePasswordPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  return (
    <ChangePasswordForm
      error={params.error}
      changePasswordAction={
        changeTemporaryPassword
      }
    />
  );
}