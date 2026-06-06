import { Header } from '../../../shared/ui/Header'
import { ProductHero, About, FBT, SMProduct, Reviews, BottomCti } from '../../../modules/Product'

export function ProductDetail() {
  return (
    <>
      <Header />
      <ProductHero />
      <About />
      <FBT />
      <SMProduct />
      <Reviews />
      <BottomCti />
    </>
  )
}
