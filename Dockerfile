# etapa 1: compilar el front con Vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# el inicio de sesion con Microsoft se configura al COMPILAR (Vite deja estos valores dentro del paquete, no se leen
# al arrancar). Son datos publicos, ningun secreto: sin ellos el front queda en el login de demostracion
ARG VITE_AUTH_MODE=""
ARG VITE_AZURE_CLIENT_ID=""
ARG VITE_AZURE_AUTHORITY=""
ARG VITE_API_SCOPE=""
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE \
    VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID \
    VITE_AZURE_AUTHORITY=$VITE_AZURE_AUTHORITY \
    VITE_API_SCOPE=$VITE_API_SCOPE
RUN npm run build

# etapa 2: nginx sirve el front y hace de entrada unica hacia los 3 servicios
# el front llama a /api-usuarios, /api-cursos, /api-trivia y /ws-trivia (igual que el proxy de Vite),
# aqui nginx hace esa misma redireccion en produccion
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx reemplaza las variables ${...} de esta plantilla con las variables de entorno al arrancar
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/proxy_comun.conf /etc/nginx/proxy_comun.conf

# urls de los servicios (con http:// o https://, sin barra al final)
ENV USUARIOS_URL=http://usuarios-service:8080 \
    CURSOS_URL=http://cursos-service:8086 \
    TRIVIA_URL=http://trivia-service:8085 \
    # 127.0.0.11 es el DNS de Docker, en Azure se cambia por 168.63.129.16
    DNS_RESOLVER=127.0.0.11
# para que nginx solo reemplace nuestras variables y no las suyas ($uri, $host, ...)
ENV NGINX_ENVSUBST_FILTER="^(USUARIOS_URL|CURSOS_URL|TRIVIA_URL|DNS_RESOLVER)$"
EXPOSE 80
