import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Download, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFetchSharedCart, useImportCart } from '@/hooks/api/useCartApi';
import { useAuthStore } from '@/modules/Auth/store/authStore';

export function SharedCartPage() {
  const navigate = useNavigate();
  const { cartId } = useParams<{ cartId: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: cart, isLoading, isError } = useFetchSharedCart(cartId ?? null);
  const importCart = useImportCart();

  const handleImport = () => {
    if (!cartId) return;
    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(`/cart/shared/${cartId}`)}`);
      return;
    }

    importCart.mutate(cartId, {
      onSuccess: (result) => {
        toast.success('Кошик додано до вашого профілю');
        navigate(`/cart/${result.new_cart_id}`);
      },
      onError: () => toast.error('Не вдалося імпортувати кошик'),
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#DDE7E3] border-t-[#265447]" />
      </main>
    );
  }

  if (isError || !cart) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <section className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-[#111A17]">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-[#6D8279]" />
          <h1 className="text-2xl font-bold text-[#173B33] dark:text-white">Кошик недоступний</h1>
          <p className="mt-2 text-[#6D8279] dark:text-[#A9B6B0]">
            Посилання неправильне або власник уже видалив цей кошик.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-[#265447] px-5 py-3 font-medium text-white"
            onClick={() => navigate('/')}
          >
            На головну
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[60vh] w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center text-sm text-[#6D8279] dark:text-[#A9B6B0]">
        <button type="button" onClick={() => navigate('/')}>Головна</button>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-medium text-[#173B33] dark:text-white">Спільний кошик</span>
      </nav>

      <section className="rounded-2xl border border-[#DDE7E3] bg-white p-5 dark:border-[#265447]/30 dark:bg-[#111A17] sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#6D8279]">Smarket</p>
            <h1 className="mt-1 text-3xl font-bold text-[#173B33] dark:text-white">{cart.name}</h1>
            <p className="mt-2 text-[#6D8279] dark:text-[#A9B6B0]">
              {cart.items.length} товарів у спільному списку
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#265447] px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleImport}
            disabled={importCart.isPending}
          >
            <Download className="h-5 w-5" />
            {importCart.isPending ? 'Додаємо…' : isAuthenticated ? 'Додати собі' : 'Увійти й додати'}
          </button>
        </div>

        <ul className="mt-7 divide-y divide-[#E7EEEB] dark:divide-[#265447]/25">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F7F5] dark:bg-[#1D2A25]">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
                ) : (
                  <ShoppingCart className="h-6 w-6 text-[#6D8279]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#173B33] dark:text-white">{item.product_name}</p>
                <p className="mt-1 text-sm text-[#6D8279] dark:text-[#A9B6B0]">
                  {item.quantity} × {Number(item.price).toFixed(2)} ₴
                </p>
              </div>
              <span className="shrink-0 font-semibold text-[#173B33] dark:text-white">
                {(Number(item.price) * item.quantity).toFixed(2)} ₴
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-between border-t border-[#DDE7E3] pt-5 text-lg font-bold text-[#173B33] dark:border-[#265447]/30 dark:text-white">
          <span>Орієнтовна сума</span>
          <span>{Number(cart.total_price).toFixed(2)} ₴</span>
        </div>
      </section>
    </main>
  );
}
