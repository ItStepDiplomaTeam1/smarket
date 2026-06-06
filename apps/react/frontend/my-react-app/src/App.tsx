
import { useState } from 'react';

// 1. Shared UI components
import { Header, Footer } from './shared/ui';

// 2. Home module components
import { Hero, CategoriesSec, ProductsSec, Hws, FinalCTA } from './modules/Home';

// 3. Product module components
import { ProductHero, About, FBT, SMProduct, BottomCti, Reviews } from './modules/Product';

// 4. Auth module components
import { Create, LoginForm, Popup, ForgotPass } from './modules/Auth';

// 5. Profile module components
import { Profile } from './modules/Profile';



//function App() {

//  const [currentPage] = useState('product'); 

//  return (
//    <div className="app-container">
//       <Header /> 
//      {currentPage === 'home' && (
//        <>
//          {/*<Hero />
//          <ProductsSec />
//          <CategoriesSec />
//          <Hws />
//          <FinalCTA />*/}
//        </>
//      )}
//
//      {currentPage === 'product' && (
//        <div className="product-page-bg">
//          {/*<ProductHero /> 
//          <About />
//          <BottomCti />
//          <FBT />
//          <Reviews />
//          <SMProduct />*/}
//
//          {/*<Hero />
//          <ProductsSec />
//          <CategoriesSec />
//          <Hws />
//          <FinalCTA />*/}
//          <Create />
//        </div>
//      )}
// 
//
//    </div>
//  );
//}
//
//export default App;

// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/routes/index.tsx'; // використовуємо відносний шлях, як домовилися

// Створюємо інстанс клієнта для керування кешем запитів
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // вимикаємо авто-запит при переході між вкладками браузера (корисно при розробці)
      retry: 1, // якщо запит впав, спробувати ще 1 раз перед тим, як показати помилку
    },
  },
});

function App() {
  return (
    // Огортаємо додаток у провайдер серверного стейту
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}

export default App;