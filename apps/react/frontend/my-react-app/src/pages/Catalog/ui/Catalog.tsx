import { Header } from '@/shared/ui/Header'
import { CtaSection, Hero, MainContent } from '@/modules/Catalog'
import { Footer } from '@/shared/ui/Footer'

export default function Catalog() {
  return (
    <>
        <Header />
        <Hero />
        <MainContent />
        <CtaSection />
        <Footer />
    </>
  )
}
