import SignUpForm from '@/app/components/auth/SignUpForm';

export const metadata = {
  title: 'Sign Up - Nutri',
  description: 'Create your Nutri account to start tracking nutrition with scientific precision',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="auth-standalone">
        <SignUpForm />
      </div>
    </div>
  );
}
