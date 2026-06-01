package main

import (
	"context"
	"log"
	"time"

	"smarket/services/products_etl/database"
	"smarket/services/products_etl/internal/config"
)

func main() {
	cfg := config.LoadConfig()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	infra, err := database.InitInfrastructure(ctx, cfg)
	if err != nil {
		log.Fatalf("Критична помилка ініціалізації інфраструктури: %v", err)
	}
	defer infra.Close(context.Background())

	log.Println("Усі підключення до БД та RabbitMQ успішно ініціалізовано!")

	_ = infra
}
