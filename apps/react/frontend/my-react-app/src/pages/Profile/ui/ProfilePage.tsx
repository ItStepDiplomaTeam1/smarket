// Импортируем ReviewsContent вместо MainContent
import { Sidebar, ReviewsContent } from '@/modules/Profile'

export default function ProfilePage() {
  return (
    <main className="w-full min-h-screen bg-[#F6FAF8]">

      <div className="flex items-start gap-6 max-w-[1200px] mx-auto w-full pt-8 pb-12 px-4">
        
        <Sidebar />
        
        <div className="flex-1 min-w-0">
          {/* Тимчасово виводимо ReviewsContent, щоб бачити і верстати сторінку відгуків */}
          <ReviewsContent />
        </div>

      </div>
      
    </main>
  )
}