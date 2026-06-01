package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
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

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	server := &http.Server{
		Addr:    ":8082",
		Handler: mux,
	}

	go func() {
		log.Println("HTTP сервер запущено на порті ", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Помилка HTTP сервера: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("Отримано сигнал зупинки. Завершення роботи...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Помилка при зупинці HTTP сервера: %v", err)
	}
}
