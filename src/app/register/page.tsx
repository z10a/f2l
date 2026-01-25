'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AtSign, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const UI_LANGUAGE_KEY = 'uiLanguage';

const COPY = {
  ar: {
    title: 'إنشاء حساب',
    subtitle: 'ابدأ الآن لإنشاء ملف شخصي ومزامنة التفضيلات.',
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirm: 'تأكيد كلمة المرور',
    agree: 'أوافق على شروط الاستخدام وسياسة الخصوصية',
    show: 'إظهار',
    hide: 'إخفاء',
    register: 'إنشاء الحساب',
    divider: 'أو سجّل عبر',
    google: 'Google',
    apple: 'Apple',
    facebook: 'Facebook',
    haveAccount: 'لديك حساب بالفعل؟',
    login: 'تسجيل الدخول',
    verifyHint: 'بعد التسجيل سيتم إرسال بريد للتحقق.',
    backHome: 'العودة للرئيسية',
  },
  en: {
    title: 'Create account',
    subtitle: 'Get started with a profile and synced preferences.',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    confirm: 'Confirm password',
    agree: 'I agree to the Terms of Service and Privacy Policy',
    show: 'Show',
    hide: 'Hide',
    register: 'Create account',
    divider: 'Or sign up with',
    google: 'Google',
    apple: 'Apple',
    facebook: 'Facebook',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    verifyHint: 'We will email you a verification link.',
    backHome: 'Back to home',
  },
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    if (typeof window === 'undefined') return 'ar';
    const stored = localStorage.getItem(UI_LANGUAGE_KEY);
    return stored === 'en' ? 'en' : 'ar';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const labels = useMemo(() => COPY[language], [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = dir === 'rtl';

  const handleSocialSignIn = (provider: 'google' | 'apple' | 'facebook') => {
    const displayName =
      provider === 'google'
        ? 'Google User'
        : provider === 'apple'
        ? 'Apple User'
        : 'Facebook User';
    localStorage.setItem(
      'userProfile',
      JSON.stringify({
        displayName: language === 'ar' ? `مستخدم ${displayName}` : displayName,
        email: `${provider}@example.com`,
        provider,
      })
    );
    router.push('/profile');
  };

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#fee2e2,_transparent_45%),linear-gradient(to_bottom,_#f8fafc,_#ffffff)] dark:bg-[radial-gradient(circle_at_top,_#3f1d1d,_transparent_45%),linear-gradient(to_bottom,_#020617,_#0f172a)]"
      dir={dir}
    >
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-lg items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-red-500">
            {labels.backHome}
          </Link>
          <button
            type="button"
            onClick={() => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
          >
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        <Card className="mt-6 w-full max-w-lg border-slate-200 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-900 dark:text-white">
                  {labels.title}
                </CardTitle>
                <CardDescription>{labels.subtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>{labels.verifyHint}</span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{labels.name}</Label>
                <div className="relative">
                  <User
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                      isRtl ? 'right-3' : 'left-3'
                    }`}
                  />
                  <Input
                    id="name"
                    placeholder={language === 'ar' ? 'أحمد علي' : 'Jane Doe'}
                    className={`${isRtl ? 'pr-9' : 'pl-9'} py-[6px]`}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{labels.email}</Label>
                <div className="relative">
                  <AtSign
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                      isRtl ? 'right-3' : 'left-3'
                    }`}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@email.com"
                    className={`${isRtl ? 'pr-9' : 'pl-9'} py-[6px]`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">{labels.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-16 py-[6px]"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500 ${
                      isRtl ? 'left-3' : 'right-3'
                    }`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPassword ? labels.hide : labels.show}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{labels.confirm}</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-16 py-[6px]"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500 ${
                      isRtl ? 'left-3' : 'right-3'
                    }`}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showConfirm ? labels.hide : labels.show}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Checkbox checked={acceptedTerms} onCheckedChange={(value) => setAcceptedTerms(Boolean(value))} />
              <span>{labels.agree}</span>
            </label>

            <Button
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-red-800"
              size="lg"
              disabled={!acceptedTerms || !email.trim() || password !== confirmPassword}
              onClick={() => {
                if (!email.trim() || password !== confirmPassword) return;
                const displayName = name.trim() || email.split('@')[0] || (language === 'ar' ? 'مستخدم' : 'User');
                localStorage.setItem(
                  'userProfile',
                  JSON.stringify({
                    displayName,
                    email: email.trim(),
                  })
                );
                router.push('/profile');
              }}
            >
              {labels.register}
            </Button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              {labels.divider}
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleSocialSignIn('google')}
              >
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-600">G</span>
                {labels.google}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleSocialSignIn('apple')}
              >
                <span className="rounded-full bg-slate-900/10 px-2 py-1 text-xs text-slate-700 dark:text-slate-200">
                  
                </span>
                {labels.apple}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleSocialSignIn('facebook')}
              >
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-600">f</span>
                {labels.facebook}
              </Button>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                {labels.verifyHint}
              </div>
              <Link href="/verify-email" className="mt-2 inline-flex text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-200">
                {language === 'ar' ? 'التحقق من البريد' : 'Verify email'}
              </Link>
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              {labels.haveAccount}{' '}
              <Link href="/login" className="font-semibold text-red-500 hover:underline">
                {labels.login}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
