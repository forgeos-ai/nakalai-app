import { useCallback, useEffect, useId, useState } from 'react';
import { GraduationCap, User, Phone, Mail, Loader2 } from 'lucide-react';
import { submitStudentProfile, type StudentProfile } from '../studentProfile';
import { SOURCE_APP } from '../sourceApp';
import { validateLeadFields, type LeadFieldErrors } from '../leadValidation';
import { usePayment } from '../hooks/usePayment';
import type { PaymentReceipt } from '../paymentGateway';
import type {
  CheckoutActivationPayload,
  CheckoutQuote,
} from '../billing';
import { getPricingTierById } from '../billing';

type LeadCaptureModalProps = {
  open: boolean;
  onSubmit: (profile: StudentProfile) => void;
  /** Cleanly dismiss the modal overlay after a successful submit path. */
  onClose?: () => void;
  /** Multi-tenant fleet tag; defaults to this app's SOURCE_APP. */
  sourceApp?: string;
  /** Drives ₹19 vs ₹49 quote inside initiatePremiumCheckout. */
  hasMatchedStyle?: boolean;
  /** Selected package id — preferred over hasMatchedStyle for checkout quote. */
  packageId?: string;
  layoutPageCount?: number;
  /** Binds verified payments to the current assignment text. */
  assignmentText?: string;
  /** Already unlocked — skip gateway, profile-only gate. */
  isPaid?: boolean;
  /** Fired after mock gateway + ledger upsert unlocks download. */
  onPaymentSuccess?: (
    receipt: PaymentReceipt,
    quote: CheckoutQuote,
    activation?: CheckoutActivationPayload,
  ) => void;
};

type FormErrors = LeadFieldErrors & { form?: string };

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

const inputErrorClass =
  'w-full rounded-lg border border-rose-500/60 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400';

function FieldLabel({
  icon: Icon,
  htmlFor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </label>
  );
}

export default function LeadCaptureModal({
  open,
  onSubmit,
  onClose,
  sourceApp = SOURCE_APP,
  hasMatchedStyle = false,
  packageId,
  layoutPageCount = 1,
  assignmentText = '',
  isPaid = false,
  onPaymentSuccess,
}: LeadCaptureModalProps) {
  const titleId = useId();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTier = packageId ? getPricingTierById(packageId) : null;

  const handlePaid = useCallback(
    (
      receipt: PaymentReceipt,
      quote: CheckoutQuote,
      activation: CheckoutActivationPayload,
    ) => {
      onPaymentSuccess?.(receipt, quote, activation);
    },
    [onPaymentSuccess],
  );

  const { isProcessingPayment, initiatePremiumCheckout } = usePayment({
    hasMatchedStyle,
    layoutPageCount,
    selectedTier,
    onPaid: handlePaid,
  });

  const busy = isSubmitting || isProcessingPayment;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const fieldErrors = validateLeadFields({
      fullName,
      email,
      mobileNumber,
      dpdpConsent,
    });

    const isValid = Object.keys(fieldErrors).length === 0;
    const consentChecked = dpdpConsent;

    if (!isValid || !consentChecked) {
      setErrors(
        isValid
          ? { dpdpConsent: 'You must consent under the DPDP Act to continue' }
          : fieldErrors,
      );
      return;
    }

    // On valid form submission, immediately advance to the secure payment initialization layer
    setIsSubmitting(true);
    setErrors({});

    try {
      const profile = await submitStudentProfile({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        dpdpConsent: true,
        sourceApp,
      });

      const userId = profile.email.trim().toLowerCase();

      if (!isPaid) {
        const result = await initiatePremiumCheckout(userId, undefined, assignmentText);
        if (!result?.ok && result?.error) {
          setErrors({
            form: `Payment could not complete: ${result.error}`,
          });
          return;
        }
        if (!result?.ok) {
          setErrors({
            form: 'Payment gateway failed. Please try again.',
          });
          return;
        }
      }

      onClose?.();
      onSubmit(profile);
    } catch (err) {
      console.error('Lead capture / checkout failed:', err);
      setErrors({
        form:
          err instanceof Error
            ? err.message
            : 'Could not save your profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40">
        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-bold text-white">
                Complete your student profile
              </h2>
              <p className="text-xs text-slate-400">
                Name, email & mobile required before download
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {/* 1. Full Name */}
          <div>
            <FieldLabel icon={User} htmlFor="lead-full-name">
              Full Name
            </FieldLabel>
            <input
              id="lead-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={busy}
              className={errors.fullName ? inputErrorClass : inputClass}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-rose-400" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* 2. Email Address */}
          <div>
            <FieldLabel icon={Mail} htmlFor="lead-email">
              Email Address
            </FieldLabel>
            <input
              id="lead-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={busy}
              className={errors.email ? inputErrorClass : inputClass}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-rose-400" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* 3. Mobile Number */}
          <div>
            <FieldLabel icon={Phone} htmlFor="lead-mobile">
              Mobile Number
            </FieldLabel>
            <input
              id="lead-mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) =>
                setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="10-digit Indian mobile"
              disabled={busy}
              className={errors.mobileNumber ? inputErrorClass : inputClass}
              aria-invalid={Boolean(errors.mobileNumber)}
            />
            {errors.mobileNumber && (
              <p className="mt-1.5 text-xs text-rose-400" role="alert">
                {errors.mobileNumber}
              </p>
            )}
          </div>

          {/* 4. DPDP Consent */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <label
              htmlFor="lead-dpdp"
              className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-300"
            >
              <input
                id="lead-dpdp"
                name="dpdpConsent"
                type="checkbox"
                checked={dpdpConsent}
                onChange={(e) => setDpdpConsent(e.target.checked)}
                disabled={busy}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
              />
              <span>
                I consent to NakalAI storing my profile data for service verification
                and future updates. (DPDP Act Compliance)
              </span>
            </label>
            {errors.dpdpConsent && (
              <p className="mt-2 text-xs text-rose-400" role="alert">
                {errors.dpdpConsent}
              </p>
            )}
          </div>

          {errors.form && (
            <p
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
              role="alert"
            >
              {errors.form}
            </p>
          )}

          {/* 5. Submit */}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Secure Payment...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving profile...
              </>
            ) : (
              'Submit & Download PDF'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
