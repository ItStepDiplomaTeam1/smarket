import { useState } from 'react';

// 1. Импортируем компоненты для главной страницы
import { Header } from './home/Header';
import { Hero } from './home/Hero';
import { ProductsSec } from './home/ProductsSec';
import { CategoriesSec } from './home/CategoriesSec';
import { Hws } from './home/Hws';
import { FinalCTA } from './home/FinalCTA';
import { Footer } from './home/Footer';

// 2. Импортируем компоненты для страницы продукта
import { ProductHero } from './product-page/ProductHero'; 
import { About } from './product-page/About';
import { FBT } from './product-page/FBT';
import { SMProduct } from './product-page/SM-Product';
import { BottomCti } from './product-page/Bottom-cti';
import { Reviews } from './product-page/Reviews';

// 3. Импортируем компонент для страниц аккаунта
import { Create } from './account/Create';
import { Login } from './account/Login';
import { Popup } from './account/Pop-up';
import { ForgotPass } from './account/ForgotPass';
import { Profile } from './account/Profile';



function App() {

  const [currentPage, setCurrentPage] = useState('product'); 

  return (
    <div className="app-container">
       <Header /> 
      {currentPage === 'home' && (
        <>
          {/*<Hero />
          <ProductsSec />
          <CategoriesSec />
          <Hws />
          <FinalCTA />
          */}

        </>
      )}

      {currentPage === 'product' && (
        <div className="product-page-bg">
          <ProductHero />
          <About />
          <Reviews />
          <FBT />
          <SMProduct />
          <BottomCti />
          

        </div>
      )}

      <Footer /> 

    </div>
  );
}

export default App;