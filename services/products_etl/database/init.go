package database

import (
	"context"
	"log"

	"smarket/services/products_etl/internal/config"
	"smarket/services/products_etl/internal/queue"

	"github.com/jackc/pgx/v5/pgxpool"
	amqp "github.com/rabbitmq/amqp091-go"
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
	mongoClient, err := ConnectMongoDB(cfg.MongoURI)
	if err != nil {
		return nil, err
	}
	if err := mongoClient.Ping(ctx, nil); err != nil {
		_ = mongoClient.Disconnect(ctx)
		return nil, err
	}

	pgPool, err := ConnectPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		_ = mongoClient.Disconnect(ctx)
		return nil, err
	}

	rabbitConn, err := queue.ConnectRabbitMQ(cfg.RabbitMQURL)
	if err != nil {
		pgPool.Close()
		_ = mongoClient.Disconnect(ctx)
		return nil, err
	}

	return &Infrastructure{
		MongoClient: mongoClient,
		PgPool:      pgPool,
		RabbitConn:  rabbitConn,
	}, nil
}
