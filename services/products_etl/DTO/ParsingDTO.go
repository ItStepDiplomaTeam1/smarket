package DTO

// ProductResponse описывает корневой ответ API Zakaz.ua на запрос списка товаров
type ProductResponse struct {
	Results []ProductDTO `json:"results"`
}

// ProductDTO описывает один сырой товар из ответа API
type ProductDTO struct {
	ID       string   `json:"id"`        // Внешний ID товара (ложится в external_id)
	Title    string   `json:"title"`     // Название товара
	EAN      string   `json:"ean"`       // Штрих-код (если есть)
	Price    float64  `json:"price"`     // Текущая цена (в гривнах, например 42.50)
	OldPrice *float64 `json:"old_price"` // Старая цена до скидки (nullable, если скидки нет)
	InStock  bool     `json:"in_stock"`  // Наличие товара в данном магазине
	Unit     string   `json:"unit"`      // Единица измерения (pcs, kg, g)
	Weight   float64  `json:"weight"`    // Вес/объем товара

	// Поля для сборки JSONBSpecifications в Postgres
	Brand     string            `json:"brand"`
	PackCount int               `json:"pack_count"`
	Metadata  map[string]string `json:"metadata"` // Дополнительные характеристики товара
}
