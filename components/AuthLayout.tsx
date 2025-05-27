import { ReactNode } from 'react';
import { AuthCarousel } from './AuthCarousel';
import Link from 'next/link';
import Image from 'next/image';

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
};

export function AuthLayout({
  children,
  title,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <AuthCarousel />

      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-16 lg:p-20">
        <div className="mb-4 flex justify-center">
          <Link href="/" className="inline-block">
            <Image
              src="/logo_inga.png"
              alt="Logo"
              width={120}
              height={120}
              className="h-24 w-auto"
            />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
            {children}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          {footerText}{' '}
          <Link
            href={footerLinkHref}
            className="font-medium text-[#84cc16] hover:text-[#65a30d] transition-colors"
          >
            {footerLinkText}
          </Link>
        </div>
      </div>
    </div>
  );
}
