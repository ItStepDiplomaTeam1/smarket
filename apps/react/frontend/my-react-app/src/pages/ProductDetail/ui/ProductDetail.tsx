import { Header } from '@/shared/ui/Header'
import { ProductHero, About, FBT, SMProduct, Reviews, BottomCti } from '@/modules/Product'

export default function ProductDetail() {
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
