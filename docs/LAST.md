1. Исправлен левый отступ                                                                                                                  
                                                                                                                                               
    Для блока с полем «Название фильтра» добавлен логический левый отступ через существующий spacing token:
                                                                                                                                              
      ─ text                                                                                                                                  
      frontend/src/app/features/boards/board/board-filter/board-filter.component.sass:33                                                      
                                                                                                                                              
    Используется margin-inline-start, поэтому отступ корректно работает и для RTL-интерфейсов. Angular development build прошёл, Impeccable   
    замечаний не обнаружил.                                                                                                                   
                       
    ────────────────────────────────────                                                                                                      
                                                                                                                                              
    2. Подготовлена сборка и публикация в Docker Hub

    Все файлы находятся здесь:                                                                                                                
                                                                                                                                              
      ─ text           
      /workspace/openproject/docker/custom-deployment                                                                                         
                                                                                                                                              
    Созданы:                                                                                                                                  
                                                                                                                                              
    • build-and-push.sh — собирает production slim image и публикует его;                                                                     
    • prepare-env.sh — создаёт приватный .env и генерирует секреты;                                                                           
    • docker-compose.yml — production-стек;                                                                                                   
    • Caddyfile — HTTP-прокси OpenProject и WebSocket;                                                                                        
    • .env.example — пример конфигурации;                                                                                                     
    • .gitignore — исключает приватный .env;                                                                                                  
    • README.md — полная инструкция.                                                                                                          
                                                                                                                                              
    Что нужно сделать перед сборкой                                                                                                           
                                                                                                                                              
    1. Создать аккаунт Docker Hub.                                                                                                            
    2. Создать публичный репозиторий, например:                                                                                               
                                                                                                                                              
      ─ text                                                                                                                                  
      myusername/openproject-custom                                                                                                           
                                                                                                                                              
    3. Установить Docker Engine, Compose v2 и Buildx.                                                                                          
    4. Проверить:                                                                                                                             
                                                                                                                                              
      ─ bash                                                                                                                                  
      docker version                                                                                                                          
      docker compose version                                                                                                                  
      docker buildx version                                                                                                                    
                                                                                                                                              
    5. Авторизоваться интерактивно:                                                                                                           
                                                                                                                                              
      ─ bash                                                                                                                                  
      docker login -u MY_DOCKERHUB_USERNAME                                                                                                   
                                                                                                                                              
    Пароль или access token в команды, Compose и Git добавлять не нужно.
                                                                                                                                              
    Сборка и push      
                                                                                                                                              
    Из корня репозитория:                                                                                                                     
                                                                                                                                              
      ─ bash                                                                                                                                  
      cd /workspace/openproject                                                                                                               
      ./docker/custom-deployment/build-and-push.sh \                                                                                          
        MY_DOCKERHUB_USERNAME/openproject-custom \                                                                                            
        18.0.0-custom.1                                                                                                                       
                                                                                                                                              
    По умолчанию собирается:                                                                                                                  
                                                                                                                                              
      ─ text                                                                                                                                  
      linux/amd64                                                                                                                             
                       
    Это стандартная архитектура большинства офисных серверов.                                                                                 
                                                                                                                                              
    Если нужен одновременно AMD64 и ARM64:                                                                                                    
                                                                                                                                              
      ─ bash           
      PLATFORMS=linux/amd64,linux/arm64 \                                                                                                     
        ./docker/custom-deployment/build-and-push.sh \                                                                                        
        MY_DOCKERHUB_USERNAME/openproject-custom \                                                                                            
        18.0.0-custom.1                                                                                                                       
                                                                                                                                              
    Если кроме версионного тега нужен latest:                                                                                                 
                                                                                                                                              
      ─ bash                                                                                                                                  
      PUBLISH_LATEST=true \                                                                                                                   
        ./docker/custom-deployment/build-and-push.sh \                                                                                        
        MY_DOCKERHUB_USERNAME/openproject-custom \                                                                                            
        18.0.0-custom.1                                                                                                                       
                                                                                                                                              
    В production рекомендуется использовать именно неизменяемый тег:                                                                          
                                                                                                                                              
      ─ text                                                                                                                                  
      18.0.0-custom.1                                                                                                                         
                                                                                                                                              
    ────────────────────────────────────                                                                                                      
                                                                                                                                              
    3. Готовый Docker Compose                                                                                                                 
                       
    Compose запускает:                                                                                                                        
                                                                                                                                              
    • кастомный OpenProject web;                                                                                                              
    • PostgreSQL 17;                                                                                                                          
    • Memcached;                                                                                                                              
    • GoodJob worker;                                                                                                                         
    • cron для приёма почты;                                                                                                                  
    • database migration и seeding;                                                                                                            
    • Hocuspocus collaborative editing;                                                                                                       
    • Caddy для HTTP и WebSocket;                                                                                                             
    • persistent volumes для базы, файлов и вложений;                                                                                         
    • health checks и зависимости запуска.                                                                                                    
                                                                                                                                              
    Адрес уже настроен на:                                                                                                                    
                                                                                                                                              
      ─ text                                                                                                                                  
      http://10.20.30.40:8080                                                                                                                 
                       
    Однократная подготовка .env                                                                                                               
                                                                                                                                              
    После создания Docker Hub-репозитория:                                                                                                    
                                                                                                                                              
      ─ bash           
      cd /workspace/openproject/docker/custom-deployment                                                                                      
      ./prepare-env.sh \                                                                                                                      
        MY_DOCKERHUB_USERNAME/openproject-custom \                                                                                            
        18.0.0-custom.1 \                                                                                                                     
        10.20.30.40:8080                                                                                                                      
                                                                                                                                              
    Скрипт:                                                                                                                                   
                                                                                                                                              
    • создаст .env;                                                                                                                           
    • добавит адрес Docker Hub image;                                                                                                         
    • сгенерирует PostgreSQL password;
    • сгенерирует SECRET_KEY_BASE;                                                                                                            
    • сгенерирует Hocuspocus secret;                                                                                                          
    • выставит права 600;                                                                                                                     
    • не выведет секреты в консоль;                                                                                                           
    • не позволит случайно перезаписать существующий .env.                                                                                    
                                                                                                                                              
    После этого нужно безопасно скопировать на рабочий сервер каталог со следующими файлами:                                                  
                                                                                                                                              
      ─ text                                                                                                                                  
      docker-compose.yml                                                                                                                      
      Caddyfile                                                                                                                               
      .env                                                                                                                                    
                                                                                                                                              
    Запуск на работе                                                                                                                          
                                                                                                                                              
    На рабочем сервере:                                                                                                                       
                                                                                                                                              
      ─ bash                                                                                                                                  
      cd /путь/к/custom-deployment                                                                                                            
      docker compose up -d                                                                                                                    
                                                                                                                                              
    Больше ничего для первоначального запуска выполнять не требуется. Compose самостоятельно скачает образы, создаст volumes, дождётся        
    PostgreSQL, применит миграции и запустит сервисы.                                                                                         
                       
    Проверка:                                                                                                                                 
                                                                                                                                              
      ─ bash                                                                                                                                  
      docker compose ps                                                                                                                       
      docker compose logs --tail=200 seeder web worker                                                                                        
      curl --fail http://10.20.30.40:8080/health_checks/default                                                                               
                                                                                                                                              
    Интерфейс:                                                                                                                                
                                                                                                                                              
      ─ text                                                                                                                                  
      http://10.20.30.40:8080                                                                                                                 
                       
    Для новой установки первоначальный вход:                                                                                                  
                                                                                                                                              
      ─ text                                                                                                                                  
      Логин: admin                                                                                                                            
      Пароль: admin                                                                                                                           
                                                                                                                                              
    Пароль следует сразу заменить.                                                                                                            
                                                                                                                                              
    Также на сервере должен быть открыт TCP-порт 8080, а IP 10.20.30.40 должен принадлежать серверу.

    Данные                                                                                                                                    
                                                                                                                                              
    Compose создаёт постоянные volumes:
                                                                                                                                              
      ─ text           
      openproject-custom_pgdata                                                                                                               
      openproject-custom_opdata                                                                                                               
                                                                                                                                              
    Обычная остановка данные не удаляет:                                                                                                      
                                                                                                                                              
      ─ bash                                                                                                                                  
      docker compose down                                                                                                                     
                                                                                                                                              
    Не выполнять без резервной копии:                                                                                                         
                                                                                                                                              
      ─ bash                                                                                                                                  
      docker compose down -v                                                                                                                  
                       
    Команда -v удаляет базу данных и вложения.
                                                                                                                                              
    Последующее подключение Nginx и SSL
                                                                                                                                              
    Инструкция уже добавлена в README. После настройки Nginx потребуется поменять в .env:
    Последующее подключение Nginx и SSL                                                                                                       
                                                                                                                                              
    Инструкция уже добавлена в README. После настройки Nginx потребуется поменять в .env:                                                     
                                                                                                                                              
      ─ dotenv                                                                                                                                
      OPENPROJECT_HOST__NAME=openproject.company.example                                                                                      
      OPENPROJECT_HTTPS=true                                                                                                                  
      OPENPROJECT_HSTS=true                                                                                                                   
      COLLABORATIVE_SERVER_URL=wss://openproject.company.example/hocuspocus                                                                   
      BIND_ADDRESS=127.0.0.1                                                                                                                  
                                                                                                                                              
    И применить:                                                                                                                              
                                                                                                                                              
      ─ bash                                                                                                                                  
      docker compose up -d