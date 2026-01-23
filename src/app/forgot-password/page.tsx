'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const UI_LANGUAGE_KEY = 'uiLanguage';

const COPY = {
  ar: {
    title: 'استعادة كلمة المرور',
    subtitle: 'أدخل بريدك لإرسال رابط إعادة التعيين.',
    email: 'البريد الإلكتروني',
    send: 'إرسال رابط الاستعادة',
    back: 'العودة لتسجيل الدخول',
  },
  en: {
    title: 'Reset password',
    subtitle: 'Enter your email to receive a reset link.',
    email: 'Email',
    send: 'Send reset link',
    back: 'Back to login',
  },
} as const;

export default function ForgotPasswordPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    if (typeof window === 'undefined') return 'ar';
    const stored = localStorage.getItem(UI_LANGUAGE_KEY);
    return stored === 'en' ? 'en' : 'ar';
  });

  const labels = useMemo(() => COPY[language], [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir={dir}>
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-md items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <Link href="/login" className="hover:text-red-500">
            {labels.back}
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
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-red-500" />
              {labels.title}
            </CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{labels.email}</Label>
              <Input id="email" type="email" placeholder="name@email.com" />
            </div>

            <Button className="w-full" size="lg">
              {labels.send}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
