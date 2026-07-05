import { Mainpart, Vergleich, SearchShops, HeadlineShops } from '@/modules/Shops'

export default function ShopsPage() {
  return (
    <>
        <HeadlineShops />
        <SearchShops />
        <Mainpart />
        <Vergleich />
    </>
  )
}