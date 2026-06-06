import { Header } from '../../../shared/ui/Header'
import { Hero, CategoriesSec, ProductsSec, Hws, FinalCTA } from '../../../modules/Home'
import { Footer } from '../../../shared/ui/Footer'

export function Home() {
  return (
    <>
      <Header />
      <Hero />
      <CategoriesSec />
      <ProductsSec />
      <Hws />
      <FinalCTA />
      <Footer />
    </>
  )
}
