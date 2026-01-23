'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AtSign, Eye, EyeOff, KeyRound, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const UI_LANGUAGE_KEY = 'uiLanguage';

const COPY = {
  ar: {
    title: 'تسجيل الدخول',
    subtitle: 'سجل الدخول للوصول إلى ملفك الشخصي ومزامنة التفضيلات.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    show: 'إظهار',
    hide: 'إخفاء',
    forgot: 'هل نسيت كلمة المرور؟',
    login: 'تسجيل الدخول',
    divider: 'أو أكمل باستخدام',
    google: 'Google',
    apple: 'Apple',
    facebook: 'Facebook',
    noAccount: 'ليس لديك حساب؟',
    register: 'إنشاء حساب',
    backHome: 'العودة للرئيسية',
  },
  en: {
    title: 'Login',
    subtitle: 'Sign in to access your profile and sync preferences.',
    email: 'Email',
    password: 'Password',
    show: 'Show',
    hide: 'Hide',
    forgot: 'Forgot password?',
    login: 'Sign in',
    divider: 'Or continue with',
    google: 'Google',
    apple: 'Apple',
    facebook: 'Facebook',
    noAccount: "Don't have an account?",
    register: 'Create account',
    backHome: 'Back to home',
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    if (typeof window === 'undefined') return 'ar';
    const stored = localStorage.getItem(UI_LANGUAGE_KEY);
    return stored === 'en' ? 'en' : 'ar';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const labels = useMemo(() => COPY[language], [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir={dir}>
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-md items-center justify-between text-sm text-slate-500 dark:text-slate-400">
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

        <Card className="mt-6 w-full max-w-md border-slate-200 shadow-lg dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">{labels.title}</CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{labels.email}</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Input id="email" type="email" placeholder="name@email.com" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{labels.password}</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-16"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPassword ? labels.hide : labels.show}
                </button>
              </div>
              <Link href="/forgot-password" className="text-xs text-red-500 hover:underline">
                {labels.forgot}
              </Link>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (!email.trim()) return;
                const displayName = email.split('@')[0] || (language === 'ar' ? 'مستخدم' : 'User');
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
            <Button className="w-full" size="lg">
              {labels.login}
            </Button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              {labels.divider}
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="outline" className="w-full">
                {labels.google}
              </Button>
              <Button variant="outline" className="w-full">
                {labels.apple}
              </Button>
              <Button variant="outline" className="w-full">
                {labels.facebook}
              </Button>
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              {labels.noAccount}{' '}
              <Link href="/register" className="font-semibold text-red-500 hover:underline">
                {labels.register}
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <User className="h-4 w-4" />
              {language === 'ar' ? 'سيتم ربط الحساب بملفك الشخصي.' : 'Your account will be linked to your profile.'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
