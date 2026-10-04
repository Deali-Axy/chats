import React from 'react';

import type { NextPageContext } from 'next';

import useTranslation from '@/hooks/useTranslation';

const Custom404 = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col text-center gap-y-2 mt-4">
      <h1 className="text-2xl">{t('404: Page not found')}</h1>
      <p className="text-gray-500">
        {t("Sorry, we couldn't find the page you were trying to access.")}
      </p>
    </div>
  );
};

const ErrorPage = ({ statusCode }: { statusCode?: number }) => {
  const { t } = useTranslation();
  const code = statusCode || 500;
  if (code === 404) {
    return <Custom404 />;
  }

  return (
    <div className="flex flex-col text-center gap-y-4 mt-4">
      <h1 className="text-2xl">{t('An error has occurred')}</h1>
      <p className="text-gray-500">
        {t('Sorry, there was an unexpected error, please try again later.')}
      </p>
    </div>
  );
};

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode =
    res?.statusCode ??
    (err as { statusCode?: number } | null | undefined)?.statusCode ??
    (err ? 500 : 404);
  return { statusCode };
};

export default ErrorPage;
