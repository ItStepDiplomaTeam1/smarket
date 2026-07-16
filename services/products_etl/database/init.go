package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"smarket/services/products_etl/internal/config"
	"smarket/services/products_etl/internal/queue"

	"github.com/jackc/pgx/v5/pgxpool"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type Infrastructure struct {
	MongoClient *mongo.Client
	PgPool      *pgxpool.Pool
	RabbitConn  *amqp.Connection
}

func (infra *Infrastructure) Close(ctx context.Context) {
	if infra.RabbitConn != nil {
		if err := infra.RabbitConn.Close(); err != nil {
			log.Printf("Помилка при закритті з'єднання RabbitMQ: %v", err)
		}
	}
	if infra.PgPool != nil {
		infra.PgPool.Close()
	}
	if infra.MongoClient != nil {
		if err := infra.MongoClient.Disconnect(ctx); err != nil {
			log.Printf("Помилка при закритті з'єднання MongoDB: %v", err)
		}
	}
}

func InitInfrastructure(ctx context.Context, cfg *config.Config) (*Infrastructure, error) {
	var mongoClient *mongo.Client
	var err error
	// Кожна спроба отримує власний 5-секундний таймаут.
	// Батьківський ctx використовується ЛИШЕ для перевірки скасування (ctrl+c тощо).
	// Це запобігає ситуації, коли один повільний Ping з'їдає весь бюджет часу.
	pingTimeout := 5 * time.Second
	retryInterval := 3 * time.Second
	maxRetries := 30 // 30 × 3s = до 90 секунд очікування

	// 1. MongoDB
	for i := 1; i <= maxRetries; i++ {
		mongoClient, err = ConnectMongoDB(cfg.MongoURI)
		if err == nil {
			pingCtx, pingCancel := context.WithTimeout(context.Background(), pingTimeout)
			err = mongoClient.Ping(pingCtx, nil)
			pingCancel()
			if err == nil {
				break
			}
			_ = mongoClient.Disconnect(context.Background())
		}
		log.Printf("[Init] MongoDB спроба %d/%d: %v. Повторна спроба через %v...", i, maxRetries, err, retryInterval)
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("ініціалізація скасована: %w", ctx.Err())
		case <-time.After(retryInterval):
		}
	}
	if err != nil {
		return nil, fmt.Errorf("не вдалось підключитись до MongoDB після %d спроб: %w", maxRetries, err)
	}

	// Створення індексів у MongoDB
	indexCtx, indexCancel := context.WithTimeout(context.Background(), 10*time.Second)
	err = EnsureMongoIndexes(indexCtx, mongoClient, cfg.MongoDBName)
	indexCancel()
	if err != nil {
		log.Printf("[Init] Попередження: не вдалось перевірити/створити індекси в MongoDB: %v", err)
	} else {
		log.Println("[Init] Індекси MongoDB успішно ініціалізовано")
	}

	// 2. PostgreSQL
	var pgPool *pgxpool.Pool
	for i := 1; i <= maxRetries; i++ {
		pgCtx, pgCancel := context.WithTimeout(context.Background(), pingTimeout)
		pgPool, err = ConnectPostgres(pgCtx, cfg.DatabaseURL)
		pgCancel()
		if err == nil {
			break
		}
		log.Printf("[Init] PostgreSQL спроба %d/%d: %v. Повторна спроба через %v...", i, maxRetries, err, retryInterval)
		select {
		case <-ctx.Done():
			_ = mongoClient.Disconnect(context.Background())
			return nil, fmt.Errorf("ініціалізація скасована: %w", ctx.Err())
		case <-time.After(retryInterval):
		}
	}
	if err != nil {
		_ = mongoClient.Disconnect(context.Background())
		return nil, fmt.Errorf("не вдалось підключитись до PostgreSQL після %d спроб: %w", maxRetries, err)
	}

	// 3. RabbitMQ
	var rabbitConn *amqp.Connection
	for i := 1; i <= maxRetries; i++ {
		rabbitConn, err = queue.ConnectRabbitMQ(cfg.RabbitMQURL)
		if err == nil {
			break
		}
		log.Printf("[Init] RabbitMQ спроба %d/%d: %v. Повторна спроба через %v...", i, maxRetries, err, retryInterval)
		select {
		case <-ctx.Done():
			pgPool.Close()
			_ = mongoClient.Disconnect(context.Background())
			return nil, fmt.Errorf("ініціалізація скасована: %w", ctx.Err())
		case <-time.After(retryInterval):
		}
	}
	if err != nil {
		pgPool.Close()
		_ = mongoClient.Disconnect(context.Background())
		return nil, fmt.Errorf("не вдалось підключитись до RabbitMQ після %d спроб: %w", maxRetries, err)
	}

	return &Infrastructure{
		MongoClient: mongoClient,
		PgPool:      pgPool,
		RabbitConn:  rabbitConn,
	}, nil
}

func EnsureMongoIndexes(ctx context.Context, client *mongo.Client, dbName string) error {
	collection := client.Database(dbName).Collection("raw_pages")
	_, err := collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "status", Value: 1}},
	})
	return err
}
