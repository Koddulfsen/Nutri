'use client';

import { useState, useRef, useEffect } from 'react';
import { verifyOTP, resendOTP } from '@/app/(auth)/actions';
import { useRouter } from 'next/navigation';

interface VerifyEmailFormProps {
  email: string;
}

const CODE_LENGTH = 6;

export default function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timeout = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timeout);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    const regex = new RegExp(`^\\d{${CODE_LENGTH}}$`);
    if (!regex.test(pastedData)) return;

    const digits = pastedData.split('');
    setCode(digits);
    setError(null);
    inputRefs.current[CODE_LENGTH - 1]?.focus();
    handleVerify(pastedData);
  };

  const handleVerify = async (otpCode: string) => {
    setIsVerifying(true);
    setError(null);

    const result = await verifyOTP(email, otpCode);

    if (result?.error) {
      setError(result.error);
      setIsVerifying(false);
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    setError(null);
    setSuccess(null);

    const result = await resendOTP(email);

    if (result?.error) {
      setError(result.error);
      setCanResend(true);
      setResendTimer(0);
    } else if (result?.success) {
      setSuccess(result.message || 'Code sent!');
    }
  };

  return (
    <div className="otp-card">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="otp-grid">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isVerifying}
            className={`otp-input ${digit ? 'filled' : ''}`}
          />
        ))}
      </div>

      {isVerifying && <p className="otp-status">Verifying code…</p>}

      <div className="otp-resend">
        <p>Didn&apos;t receive the code?</p>
        {canResend ? (
          <button onClick={handleResend}>Resend code</button>
        ) : (
          <span className="timer">Resend in {resendTimer}s</span>
        )}
      </div>

      <div className="otp-back">
        <button onClick={() => router.push('/signup')}>← Back to signup</button>
      </div>
    </div>
  );
}
