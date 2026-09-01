import Head from 'next/head';

import LibraryContent from '@/components/Library/LibraryContent';

import { UserProvider } from '@/providers/UserProvider';

const LibraryPage = () => (
  <UserProvider>
    <Head>
      <title>资料库 - Ayaka Chats</title>
      <meta
        name="viewport"
        content="height=device-height,width=device-width,initial-scale=1,user-scalable=no"
      />
    </Head>
    <LibraryContent />
  </UserProvider>
);

export default LibraryPage;
