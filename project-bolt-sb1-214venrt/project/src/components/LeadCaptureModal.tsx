import { useEffect, useId, useState } from 'react';
import { GraduationCap, User, Phone, Building2, Calendar, Loader2 } from 'lucide-react';
import {
  GRADUATION_YEARS,
  isValidMobileNumber,
  submitStudentProfile,
  type GraduationYear,
  type StudentProfile,
} from '../studentProfile';

type LeadCaptureModalProps = {
  open: boolean;
  onSubmit: (profile: StudentProfile) => void;
};

type FormErrors = Partial<
  Record<'fullName' | 'mobileNumber' | 'collegeName' | 'graduationYear' | 'dpdpConsent' | 'form', string>
>;

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

const selectClass =
  'w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 transition-colors hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

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

export default function LeadCaptureModal({ open, onSubmit }: LeadCaptureModalProps) {
  const titleId = useId();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [graduationYear, setGraduationYear] = useState<GraduationYear | ''>('');
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = 'Full name is required';
    if (!isValidMobileNumber(mobileNumber)) {
      next.mobileNumber = 'Enter a valid 10-digit mobile number';
    }
    if (!collegeName.trim()) next.collegeName = 'College name is required';
    if (!graduationYear) next.graduationYear = 'Select your graduation year';
    if (!dpdpConsent) {
      next.dpdpConsent = 'You must consent under the DPDP Act to continue';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate() || !graduationYear) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, form: undefined }));

    try {
      const profile = await submitStudentProfile({
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        collegeName: collegeName.trim(),
        graduationYear,
        dpdpConsent: true,
      });
      onSubmit(profile);
    } catch (err) {
      console.error('Lead capture failed:', err);
      setErrors((prev) => ({
        ...prev,
        form:
          err instanceof Error
            ? err.message
            : 'Could not save your profile. Please try again.',
      }));
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
                Required once before downloading your assignment PDF
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          <div>
            <FieldLabel icon={User} htmlFor="lead-full-name">
              Full Name
            </FieldLabel>
            <input
              id="lead-full-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={isSubmitting}
              className={inputClass}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-400">{errors.fullName}</p>
            )}
          </div>

          <div>
            <FieldLabel icon={Phone} htmlFor="lead-mobile">
              Mobile Number
            </FieldLabel>
            <input
              id="lead-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) =>
                setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="10-digit mobile number"
              disabled={isSubmitting}
              className={inputClass}
            />
            {errors.mobileNumber && (
              <p className="mt-1 text-xs text-rose-400">{errors.mobileNumber}</p>
            )}
          </div>

          <div>
            <FieldLabel icon={Building2} htmlFor="lead-college">
              College Name
            </FieldLabel>
            <input
              id="lead-college"
              type="text"
              autoComplete="organization"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g. Delhi University"
              disabled={isSubmitting}
              className={inputClass}
            />
            {errors.collegeName && (
              <p className="mt-1 text-xs text-rose-400">{errors.collegeName}</p>
            )}
          </div>

          <div>
            <FieldLabel icon={Calendar} htmlFor="lead-year">
              Graduation Year
            </FieldLabel>
            <select
              id="lead-year"
              value={graduationYear === '' ? '' : String(graduationYear)}
              onChange={(e) =>
                setGraduationYear(
                  e.target.value === ''
                    ? ''
                    : (Number(e.target.value) as GraduationYear),
                )
              }
              disabled={isSubmitting}
              className={selectClass}
            >
              <option value="">Select year</option>
              {GRADUATION_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.graduationYear && (
              <p className="mt-1 text-xs text-rose-400">{errors.graduationYear}</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <label
              htmlFor="lead-dpdp"
              className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-300"
            >
              <input
                id="lead-dpdp"
                type="checkbox"
                checked={dpdpConsent}
                onChange={(e) => setDpdpConsent(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
              />
              <span>
                I consent to NakalAI storing my profile data for service verification
                and future updates. (DPDP Act Compliance)
              </span>
            </label>
            {errors.dpdpConsent && (
              <p className="mt-2 text-xs text-rose-400">{errors.dpdpConsent}</p>
            )}
          </div>

          {errors.form && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
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
