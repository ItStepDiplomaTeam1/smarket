import { CtaSection, Hero, MainContent } from '@/modules/Catalog'
import { useLocation } from 'react-router-dom'

export default function Catalog() {
  const location = useLocation()

  return (
    <>
        <Hero />
        <MainContent key={location.key} />
        <CtaSection />
    </>
  )
}
