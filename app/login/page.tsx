import LoginForm from '@/app/components/auth/LoginForm';

export const metadata = {
  title: 'Log In - Nutri',
  description: 'Log in to your Nutri account to track nutrition with scientific precision',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="auth-standalone">
        <LoginForm />
      </div>
    </div>
  );
}
