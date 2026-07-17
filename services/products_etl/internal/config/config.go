package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI          string `env:"MONGO_URI,required"`
	MongoDBName       string `env:"MONGO_DB_NAME" envDefault:"smarket_datalake"`
	DatabaseURL       string `env:"DATABASE_URL,required"`
	RabbitMQURL       string `env:"RABBITMQ_URL,required"`
	ETLQueueName      string `env:"ETL_QUEUE_NAME" envDefault:"etl_tasks"`
	Environment       string `env:"ENV" envDefault:"development"`
	SearchServiceURL  string `env:"SEARCH_SERVICE_URL" envDefault:"http://search_service:8083"`
	ETLAdminKey       string `env:"ETL_ADMIN_KEY,required"`
}

func LoadConfig() *Config {
	loadDotEnv()

	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		log.Fatalf("Критична помилка парсингу конфігурації: %v", err)
	}
	return cfg
}

// loadDotEnv шукає файл .env у декількох місцях:
// 1. Поточний робочий директорій (стандартна поведінка)
// 2. Директорія, де лежить бінарник (при запуску з go run / IDE)
// 3. Два рівні вгору від бінарника (при запуску зібраного бінарника з cmd/)
//
// Таким чином .env знаходиться незалежно від того, звідки запущено процес.
func loadDotEnv() {
	// Кандидати на пошук у порядку пріоритету
	candidates := dotEnvCandidates()

	for _, path := range candidates {
		if err := godotenv.Load(path); err == nil {
			log.Printf("[config] Завантажено конфігурацію з %s", path)
			return
		}
	}

	// Жоден файл не знайдено — використовуємо системні змінні середовища.
	// Це нормально для Docker / CI, де .env не потрібен.
	log.Println("[config] Файл .env не знайдений, використовуються змінні середовища системи")
}

// dotEnvCandidates повертає список шляхів до .env у порядку пріоритету.
func dotEnvCandidates() []string {
	candidates := []string{".env"} // CWD — найвищий пріоритет

	// Директорія бінарника (os.Executable() повертає повний шлях до процесу)
	if exe, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exe)
		candidates = append(candidates,
			filepath.Join(exeDir, ".env"),             // поруч з бінарником
			filepath.Join(exeDir, "..", "..", ".env"), // два рівні вгору
		)
	}

	return candidates
}
