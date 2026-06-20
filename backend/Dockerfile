FROM php:8.4-fpm-bookworm

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ADD --chmod=0755 \
    https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions \
    /usr/local/bin/install-php-extensions

RUN apt-get update \
    && apt-get install -y --no-install-recommends git curl zip unzip \
    && install-php-extensions pdo_mysql zip intl opcache bcmath pcntl posix sockets \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php-fpm/zz-laravel.conf /usr/local/etc/php-fpm.d/zz-laravel.conf

WORKDIR /var/www/backend

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction || true

COPY . .

RUN composer install --no-dev --prefer-dist --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 9000
CMD ["php-fpm"]
