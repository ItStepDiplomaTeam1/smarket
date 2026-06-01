package config

import (
	"log"

	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI    string `env:"MONGO_URI,required=true"`
	DatabaseURL string `env:"DATABASE_URL,required=true"`
	RabbitMQURL string `env:"RABBITMQ_URL,required=true"`
	Environment string `env:"ENV" envDefault:"development"`
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
