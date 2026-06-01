package DTO

// StoreDTO описывает один магазин из справочника Zakaz.ua
type StoreDTO struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	RetailChain string     `json:"retail_chain"`
	RegionID    string     `json:"region_id"`
	City        string     `json:"city"`
	Currency    string     `json:"currency"`
	IsActive    bool       `json:"is_active"`
	Address     AddressDTO `json:"address"`
	Coords      CoordsDTO  `json:"coords"`
}

// AddressDTO описывает вложенный объект адреса
type AddressDTO struct {
	City     string `json:"city"`
	Street   string `json:"street"`
	Building string `json:"building"`
}

// CoordsDTO описывает географические координаты
type CoordsDTO struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}
