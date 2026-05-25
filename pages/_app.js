import '../styles/globals.css'
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayout = ['/login', '/signup'].includes(router.pathname);

  if (noLayout) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}