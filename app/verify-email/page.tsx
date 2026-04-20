import VerifyEmailForm from '@/app/components/auth/VerifyEmailForm';

export const metadata = {
  title: 'Verify Email - Nutri',
  description: 'Enter the verification code sent to your email',
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email;

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="otp-card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="logo-large" style={{ marginBottom: 24 }}>Nutri</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 400,
              color: 'var(--text-1)',
              margin: '0 0 8px',
            }}
          >
            Missing email
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>
            Please return to the signup page and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="logo-large" style={{ marginBottom: 18 }}>Nutri</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: 'var(--text-1)',
              margin: '0 0 6px',
              lineHeight: 1.1,
            }}
          >
            Check your email
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>
            We sent a 6-digit code to{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{email}</span>
          </p>
        </div>

        <VerifyEmailForm email={email} />
      </div>
    </div>
  );
}
