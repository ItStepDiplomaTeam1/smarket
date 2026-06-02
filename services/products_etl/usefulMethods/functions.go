package usefulMethods

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

func MakeRequest(method_type string, url string, bodyData interface{}, ifZakazUA bool) (*http.Response, error) {
	var bodyReader *bytes.Buffer

	if bodyData != nil {
		jsonData, err := json.Marshal(bodyData) // struct -> json
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewBuffer(jsonData) // json -> потік байтів для передачі в мережу
	} else {
		bodyReader = bytes.NewBuffer(nil)
	}

	client := &http.Client{Timeout: time.Second * 10} // таймаут у 10 сек, якщо сервер тормозить або повільний

	req, err := http.NewRequest(method_type, url, bodyReader) // готується об'єкт для реквесту (аргументи - тип, лінк, потік байтів)

	if err != nil {
		return nil, err
	}

	if ifZakazUA == true {
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
		req.Header.Set("Accept-Language", "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Referer", "https://zakaz.ua/")
	} else {
		req.Header.Set("User-Agent", "Smarket-Worker/1.0")
		req.Header.Set("Authorization", "Bearer your_token_here")
	}

	if bodyData != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	return client.Do(req) // виконання реквесту
}
