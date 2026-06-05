package config

import (
	"log"

	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI      string `env:"MONGO_URI,required"`
	MongoDBName   string `env:"MONGO_DB_NAME" envDefault:"smarket_datalake"`
	DatabaseURL   string `env:"DATABASE_URL,required"`
	RabbitMQURL   string `env:"RABBITMQ_URL,required"`
	ETLQueueName  string `env:"ETL_QUEUE_NAME" envDefault:"etl_tasks"`
	Environment   string `env:"ENV" envDefault:"development"`
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Попередження: файл .env не знайдений, використовуються змінні середовища системи")
	}

	cfg := &Config{}

	if err := env.Parse(cfg); err != nil {
		log.Fatalf("Критична помилка парсингу конфігурації: %v", err)
	}

	return cfg
}
