package main

import (
	"context"
	"log"
	"time"

	"smarket/services/products_etl/database"
	"smarket/services/products_etl/internal/config"
	"smarket/services/products_etl/internal/queue"
)

func main() {
	cfg := config.LoadConfig()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoClient, err := database.ConnectMongoDB(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatalf("Критична помилка ініціалізації MongoDB: %v", err)
	}
	defer func() {
		if err := mongoClient.Disconnect(context.Background()); err != nil {
			log.Printf("Помилка при закритті з'єднання MongoDB: %v", err)
		}
	}()

	if err := mongoClient.Ping(ctx, nil); err != nil {
		log.Fatalf("Сервер MongoDB доступний, але відхилив Ping: %v", err)
	}
	log.Println("Успішне безпечне підключення до MongoDB!")

	pgPool, err := database.ConnectPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Критична помилка ініціалізації PostgreSQL: %v", err)
	}
	defer pgPool.Close()
	log.Println("Успішне безпечне підключення до PostgreSQL (NeonDB)!")

	rabbitConn, err := queue.ConnectRabbitMQ(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("Критична помилка ініціалізації RabbitMQ: %v", err)
	}
	defer func() {
		if err := rabbitConn.Close(); err != nil {
			log.Printf("Помилка при закритті з'єднання RabbitMQ: %v", err)
		}
	}()
	log.Println("Успішне безпечне підключення до RabbitMQ!")

	_, _, _ = mongoClient, pgPool, rabbitConn
}
