import dynamic from 'next/dynamic'
import Head from 'next/head'
import Header from '../components/Header'
import CoverForm from '../components/CoverForm'

export default function Home() {
  return (
    <>
      <Head>
        <meta name="description" content="AI Cover Letter Generator — BYOK, client-side OpenAI, static" />
      </Head>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <CoverForm />
      </main>
    </>
  )
}
