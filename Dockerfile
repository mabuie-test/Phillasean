# 1) Base oficial com Apache + PHP 8.1
FROM php:8.1-apache

# 2) Instala pacotes do sistema e extensões PHP
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
      git curl zip libzip-dev libonig-dev \
      libssl-dev libsasl2-dev zlib1g-dev \
      libcurl4-openssl-dev pkg-config \
      make autoconf g++ ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    pecl install mongodb-1.21.0 && \
    docker-php-ext-enable mongodb && \
    docker-php-ext-install zip mbstring && \
    docker-php-ext-enable opcache

# 3) Instala Composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN curl -sS https://getcomposer.org/installer \
    | php -- --install-dir=/usr/bin --filename=composer

# 4) Copia código e instala dependências PHP
WORKDIR /var/www/html
COPY . /var/www/html
RUN composer install --no-dev --optimize-autoloader

# 5) Cria pasta de faturas e garante permissão
RUN mkdir -p public/assets/invoices \
    && chown -R www-data:www-data public/assets/invoices

# 6) Habilita mod_rewrite (caso use .htaccess)
RUN a2enmod rewrite

# 7) Exponha porta 80 e inicialize Apache
EXPOSE 80
CMD ["apache2-foreground"]
